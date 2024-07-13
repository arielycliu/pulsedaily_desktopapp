function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function callQuoteApi() {
    window.indexBridge.callQuoteApi();
}

function callGetQuestionApi() {
    window.indexBridge.callGetQuestionApi();
}

function callPostResponseApi() {
    // Get rating value
    let rating = document.querySelector('input[name="rating"]:checked');
    rating = rating ? rating.value : null;
    if (!rating) {
        alert("You must specify a rating.");
        return;
    }

    // Get details value
    const details = document.getElementById('details').value;
    window.indexBridge.callPostResponseApi(rating, details);
}

window.onload = function() {
    callQuoteApi();
    callGetQuestionApi();
    const confirmation = document.getElementById("confirmation");
    confirmation.style.display = "none";
};