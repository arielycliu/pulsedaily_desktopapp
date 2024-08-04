const { contextBridge, ipcMain, ipcRenderer } = require('electron')

// methods that will be exposed to renderer (frontend) process
let indexBridge = {
    callRegisterEmployee: callRegisterEmployee,
    callStartMain: callStartMain
}

async function callStartMain() {
    await ipcRenderer.invoke("startMain");
}

async function callRegisterEmployee(email) {
    const response = await ipcRenderer.invoke("registerEmployee", email);
    const status = response.status;
    const message = document.getElementById("message");
    message.style.display = "inline";
    if (status == 200) {
        message.innerText = "Email received. Thank you!";
        setTimeout(() => {
            callStartMain();
            window.close();
        }, 1000);
    } else {
        let msg = response.body + "\nPlease contact support if you continue to have issues.";
        message.innerText = msg;
    }
}
contextBridge.exposeInMainWorld("indexBridge", indexBridge)