function registerEmployee() {
    let email = document.getElementById('email').value;
    window.indexBridge.callRegisterEmployee(email);
}

function preventEnterClear(event) {
    if (event.key === "Enter") {
        event.preventDefault();
    } 
}

window.onload = function() {
    const message = document.getElementById("message");
    message.style.display = "none";
};