// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcMain, ipcRenderer } = require('electron')

// methods that will be exposed to renderer (frontend) process
let indexBridge = {
    callQuoteApi: callQuoteApi,
    callGetQuestionApi: callGetQuestionApi,
    callPostResponseApi: callPostResponseApi
}

async function callQuoteApi() {
    const result = await ipcRenderer.invoke("callQuoteApi"); // send ipc to main process
    const quote = document.getElementById("quote");
    quote.innerText = result.q;
    const author = document.getElementById("quote-author");
    author.innerText = "- " + result.a;
}

async function callGetQuestionApi() {
    const result = await ipcRenderer.invoke("callGetQuestionApi"); 
    const question_id = result.question_id;
    const question = document.getElementById("question");
    question.innerText = result.content;
    await updateQuestionID(question_id);
}

async function callPostResponseApi(rating, details) {
    const result = await ipcRenderer.invoke("callPostResponseApi", rating, details); 
    if (result === "Success") {
        const confirmation = document.getElementById("confirmation");
        confirmation.style.display = "inline";
        setTimeout(() => {
            window.close();
        }, 1500);
    }
}

// expose indexBridge to render process
contextBridge.exposeInMainWorld("indexBridge", indexBridge)