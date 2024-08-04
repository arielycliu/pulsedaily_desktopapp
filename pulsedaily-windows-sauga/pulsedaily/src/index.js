const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const AutoLaunch = require('auto-launch');
const crypto = require('crypto');

const userDataPath = app.getPath('userData');
const configFilePath = path.join(userDataPath, 'config.json');

export function readUserData() {
    try {        
        if (fs.existsSync(configFilePath)) {
            const dataString = fs.readFileSync(configFilePath, 'utf8');
            if (dataString) {
                return JSON.parse(dataString);
            }
        } else {
            fs.writeFileSync(configFilePath, '{}', 'utf8');
            return {};
        }
    } catch(error) {
        console.error('Error reading user data:', error);
        return {}; 
    }
}

export function writeUserData(key, value) {
    let data = {};
    const dataString = fs.readFileSync(configFilePath, 'utf8');
    if (dataString) {
        data = JSON.parse(dataString);
    }

    data[key] = value;
    const jsonString = JSON.stringify(data, null, 2); 
    try {
        fs.writeFileSync(configFilePath, jsonString, 'utf-8');
        return;
    } catch(error) {
        console.error('Error writing user settings to config file.', error)
    }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 400,
        height: 660,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'images', 'icon.ico')
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // mainWindow.webContents.openDevTools();
};

const createPopup = () => {
    const emailPopup = new BrowserWindow({
        width: 400,
        height: 550,
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'popup', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'images', 'icon.ico')
    });
    let modal = emailPopup;
    modal.loadFile(path.join(__dirname, 'popup', 'popup.html'));
    modal.once('ready-to-show', () => {
        modal.show();
    });
};

// Schedule job
let data = readUserData();
let cronJobString = "0 10 * * 1-5";
if (data == undefined || !(data.hasOwnProperty('cronJob'))) {
    writeUserData("cronJob", "0 10 * * 1-5");
} else {
    cronJobString = data.cronJob;
}
const job = schedule.scheduleJob(cronJobString, async function () {
    console.log("Starting PulseDaily");

    let data = readUserData();
    
    if (data == undefined || !(data.hasOwnProperty('firstRun')) || data.firstRun == true) {
        createPopup();
    } else {
        writeUserData("firstRun", false);

        // call api to check if we have already asked question
        let hasAnswered = await callHasAnswered();
        if (hasAnswered == true) {
            console.log("Already answered a question today, will skip startup.")
            return; // don't ask them the same question again
        }
        createWindow();
    }
});

app.whenReady().then(async () => {
    console.log(configFilePath);
    console.log(cronJobString);

    let autoLauncher = new AutoLaunch({
        name: "PulseDaily", // For Electron apps, you don't have to specify the path
        isHidden: true
    });
    // ensure that autoLaunch is enabled
    autoLauncher.isEnabled().then((isEnabled) => {
        if (!isEnabled) {
            autoLauncher.enable(); // Corrected from autoLaunch.enable() to autoLauncher.enable()
        }
    }).catch(err => {
        console.error("Failed to check auto-launch status:", err);
    });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle("startMain", () => {
    createWindow();
});

ipcMain.handle("registerEmployee", async (event, email) => {    
    // Make API call with the email
    let response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/employee', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "email": email })
    });
    const data = await response.json();
    console.log(data);
    if (data.status == 200) {
        let emp_hash = data.body.emp_hash;
        writeUserData('authKey', emp_hash);  // Save emp_hash in store
        writeUserData('firstRun', false);     // Save firstRun in store
    }
    return data;
});

ipcMain.handle("callQuoteApi", async () => {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    return data[0];
});

ipcMain.handle("callGetQuestionApi", async () => {
    let data = readUserData();
    if (data == undefined || !(data.hasOwnProperty('authKey'))) {
        console.log("Error: authKey is missing. Please check config file.");
        return;
    }
    const requestBody = {
        emp_hash: data.authKey
    };

    const response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    data = await response.json();
    console.log(data);
    if (data.status == 200) {
        writeUserData('questionId', data.body.question_id); // for debugging
    }
    return data;
});

ipcMain.handle("callPostResponseApi", async (event, ratings, details) => {
    let data = readUserData();
    if (data == undefined || !(data.hasOwnProperty('authKey')) || !(data.hasOwnProperty('questionId'))) {
        console.log("Error: authKey or questionId is missing. Please check config file.");
        return;
    }

    const requestBody = {
        emp_hash: data.authKey,
        question_id: data.questionId,
        rating: ratings,
        details: details
    };
    const response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/respond', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    data = await response.json();
    console.log(data);
    return data;
})

const callHasAnswered = async () => {
    let data = readUserData();
    if (data == undefined || !(data.hasOwnProperty('authKey')) || !(data.hasOwnProperty('questionId'))) {
        // means we are missing the emp hash or questionId and cannot call the api endpoint
        return false;
    }
    
    const requestBody = {
        emp_hash: data.authKey,
        question_id: data.questionId
    };
    const response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/hasAnswered', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    data = await response.json();
    console.log(data);
    if (data.status == 200 && data.body == true) {
        return true;
    }
    return false;
};