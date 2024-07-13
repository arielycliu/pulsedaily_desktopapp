const { contextBridge, ipcRenderer } = require('electron')

// methods that will be exposed to renderer (frontend) process
let indexBridge = {
    callRegisterEmployee: callRegisterEmployee
}
async function startMain(response) {
    await ipcRenderer.invoke("startMain", response);
}

async function callRegisterEmployee(email) {
    const response = await ipcRenderer.invoke("registerEmployee", email);
    const status = response.status;
    if (status === 404) {
        msg = "Organization not found. Please confirm that your email suffix is correct, and contact support if you still have further issues."
        const message = document.getElementById("message");
        message.innerText = msg;
        message.style.display = "inline";
    } 
    else if (status === 409) {
        msg = "Employee email is already in the database. Please confirm that your email is correct, and contact support if you still have further issues."
        const message = document.getElementById("message");
        message.innerText = msg;
        message.style.display = "inline";
    }
    else if (status === 200) {
        const message = document.getElementById("message");
        message.innerText = "Email received. Thank you!";
        message.style.display = "inline";
        setTimeout(() => {
            window.close();
            startMain(response);
        }, 1000);
    }
}
contextBridge.exposeInMainWorld("indexBridge", indexBridge)