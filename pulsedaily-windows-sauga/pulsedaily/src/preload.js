const { contextBridge, ipcMain, ipcRenderer } = require('electron')

let indexBridge = {
    callQuoteApi: callQuoteApi,
    callGetQuestionApi: callGetQuestionApi,
    callPostResponseApi: callPostResponseApi
}

async function callQuoteApi() {
    const result = await ipcRenderer.invoke("callQuoteApi");
    const quote = document.getElementById("quote");
    quote.innerText = result.q;
    const author = document.getElementById("quote-author");
    author.innerText = "- " + result.a;
}

async function callGetQuestionApi() {
    const response = await ipcRenderer.invoke("callGetQuestionApi"); 
    console.log(response);
    const qerror = document.getElementById("qerror");
    if (response.status == 200) {
        const question = document.getElementById("question");
        question.innerText = response.body.content;
        qerror.style.display = "none";
    } else {
        msg = response.body + "\nPlease contact support if you continue to have issues."
        qerror.innerText = msg;
        qerror.style.display = "inline";
    }
}

async function callPostResponseApi(rating, details) {
    const response = await ipcRenderer.invoke("callPostResponseApi", rating, details); 
    const confirmation = document.getElementById("confirmation");
    confirmation.style.display = "inline";
    if (response.status == 200) {
        confirmation.innerText = "Thanks for your input!";
        setTimeout(() => {
            window.close();
        }, 1500);
    } else {
        let msg = response.body + "\nPlease contact support if you continue to have issues.";
        confirmation.innerText = msg;
    }
}

contextBridge.exposeInMainWorld("indexBridge", indexBridge)