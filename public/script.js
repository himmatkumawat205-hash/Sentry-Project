const socket = io();

const contentInput =
    document.getElementById("contentInput");

const generateBtn =
    document.getElementById("generateBtn");

const generatedSection =
    document.getElementById("generatedSection");

const generatedCode =
    document.getElementById("generatedCode");

const copyBtn =
    document.getElementById("copyBtn");

const codeInput =
    document.getElementById("codeInput");

const accessBtn =
    document.getElementById("accessBtn");

const resultSection =
    document.getElementById("resultSection");

const receivedContent =
    document.getElementById("receivedContent");

const copyReceivedBtn =
    document.getElementById("copyReceivedBtn");

const message =
    document.getElementById("message");


// Generate code

generateBtn.addEventListener("click", () => {

    const content = contentInput.value;

    socket.emit("createCode", content);

});


// Code created

socket.on("codeCreated", (code) => {

    generatedCode.textContent = code;

    generatedSection.classList.remove("hidden");

    message.textContent =
        "Code generated successfully.";

});


// Copy generated code

copyBtn.addEventListener("click", () => {

    navigator.clipboard.writeText(
        generatedCode.textContent
    );

    message.textContent =
        "Code copied.";

});


// Access code

accessBtn.addEventListener("click", () => {

    const code = codeInput.value;

    if (!code) {
        message.textContent =
            "Please enter a code.";

        return;
    }

    socket.emit("accessCode", code);

});


// Content received

socket.on("contentReceived", (content) => {

    receivedContent.textContent = content;

    resultSection.classList.remove("hidden");

    message.textContent =
        "Content received successfully.";

});


// Copy received content

copyReceivedBtn.addEventListener("click", () => {

    navigator.clipboard.writeText(
        receivedContent.textContent
    );

    message.textContent =
        "Content copied.";

});


// Errors

socket.on("errorMessage", (error) => {

    message.textContent = error;

});