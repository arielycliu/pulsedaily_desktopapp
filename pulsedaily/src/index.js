const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const schedule = require('node-schedule');
const path = require('node:path');

const AutoLaunch = require('auto-launch');
const autoLauncher = new AutoLaunch({
    name: "PulseDaily",
    isHidden: true
});
// ensure that autoLaunch is enabled
autoLauncher.isEnabled().then(function(isEnabled) {
    if (isEnabled) return;
    autoLauncher.enable();  // if not already enabled, enable it
}).catch(function (err) {
    throw err;
});

global.question_id = 0;

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
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'images', 'icon.ico')
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
};

const createPopup = () => {
    const emailPopup = new BrowserWindow({
        width: 400,
        height: 500,
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'popup/preloadPopup.js')
        },
        icon: path.join(__dirname, 'images', 'icon.ico')
    });
    let modal = emailPopup;
    modal.loadFile("src/popup/popup.html");
    modal.once('ready-to-show', () => {
        modal.show();
    });
};

// Schedule job
const job = schedule.scheduleJob('50 18 * * *', function () {
    console.log("Starting PulseDaily");

    if (mainWindow) {
        mainWindow.show();
    } else {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    const { default: Store } = await import('electron-store');
    const store = new Store();
    // store.set('firstRun', true);                                          // COMMENT OUT
    if (store.get("firstRun") != false) {
        createPopup();
    } else {
        createWindow();
    }

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle("startMain", async (event, response) => {
    createWindow();
});

ipcMain.handle("registerEmployee", async (event, email) => {
    // Make API call with the email
    response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/employee', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "email": email })
    });
    const data = await response.json();
    if (data.status === 200) {
        // Update firstRun in store
        const { default: Store } = await import('electron-store');
        const store = new Store();
        store.set('firstRun', false);

        // Save emp_hash in store
        emp_hash = JSON.parse(data.emp_hash);
        store.set('auth-key', emp_hash);
    }
    return data
});

// call apis in main since we have access to nodejs apis here
ipcMain.handle("callQuoteApi", async () => {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    return data[0];
});

ipcMain.handle("callGetQuestionApi", async () => {
    const { default: Store } = await import('electron-store');
    const store = new Store();
    const requestBody = {
        emp_hash: store.get('auth-key')
    };

    const response = await fetch('https://xzrnwqkv35.execute-api.us-east-1.amazonaws.com/questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    if (data.status === 200) {
        body = JSON.parse(data.body)
        global.question_id = body.question_id;
        return body;
    }
});

ipcMain.handle("callPostResponseApi", async (event, ratings, details) => {
    const { default: Store } = await import('electron-store');
    const store = new Store();
    const requestBody = {
        emp_hash: store.get('auth-key'),
        question_id: global.question_id,
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
    const data = await response.json();
    return data;
})