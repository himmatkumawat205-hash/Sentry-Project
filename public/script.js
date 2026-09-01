// =========================
// ELEMENTS
// =========================

const contentInput = document.getElementById("contentInput");
const generateBtn = document.getElementById("generateBtn");

const generatedSection = document.getElementById("generatedSection");
const generatedCode = document.getElementById("generatedCode");

const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

const codeInput = document.getElementById("codeInput");
const accessBtn = document.getElementById("accessBtn");

const resultSection = document.getElementById("resultSection");
const receivedContent = document.getElementById("receivedContent");

const copyReceivedBtn = document.getElementById("copyReceivedBtn");
const clearResultBtn = document.getElementById("clearResultBtn");

const message = document.getElementById("message");
let messageTimeout;


// =========================
// SHOW MESSAGE
// =========================

function showMessage(text, type = "success") {
    clearTimeout(messageTimeout);
    message.textContent = text;

    message.className = `message ${type}`;

    messageTimeout = setTimeout(() => {
        message.className = "message hidden";
    }, 4000);
}

async function getResponseData(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return {};
}


// =========================
// GENERATE CODE
// =========================

generateBtn.addEventListener("click", async () => {

    const content = contentInput.value;

    if (!content.trim()) {
        showMessage(
            "Please enter some content first.",
            "error"
        );

        contentInput.focus();
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    try {

        const response = await fetch("/api/create", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                content: content
            })
        });

        const data = await getResponseData(response);

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to generate code."
            );
        }

        // Show generated code
        generatedCode.textContent = data.code;

        generatedSection.classList.remove("hidden");

        generateBtn.textContent = "Generate New Code";
        generateBtn.disabled = false;

        showMessage(
            "Your code was generated successfully.",
            "success"
        );

    } catch (error) {

        console.error("Generate error:", error);

        generateBtn.textContent = "Generate Code";
        generateBtn.disabled = false;

        showMessage(
            error.message || "Something went wrong.",
            "error"
        );
    }
});


// =========================
// COPY GENERATED CODE
// =========================

copyBtn.addEventListener("click", async () => {

    const code = generatedCode.textContent;

    try {

        await navigator.clipboard.writeText(code);

        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = "Copy";
        }, 1500);

    } catch (error) {

        console.error("Copy error:", error);

        showMessage(
            "Unable to copy the code.",
            "error"
        );
    }
});


// =========================
// SHARE CODE
// =========================

shareBtn.addEventListener("click", async () => {

    const code = generatedCode.textContent;

    const shareText =
        `QuickCode access code: ${code}`;

    if (navigator.share) {

        try {

            await navigator.share({
                title: "QuickCode",
                text: shareText
            });

        } catch (error) {

            // User cancelled sharing
            console.log("Share cancelled.");

        }

    } else {

        try {

            await navigator.clipboard.writeText(
                shareText
            );

            showMessage(
                "Share message copied.",
                "success"
            );

        } catch (error) {

            showMessage(
                "Unable to share the code.",
                "error"
            );
        }
    }
});


// =========================
// ACCESS CODE
// =========================

accessBtn.addEventListener("click", async () => {

    const code = codeInput.value.trim();

    if (!code) {

        showMessage(
            "Please enter your access code.",
            "error"
        );

        codeInput.focus();

        return;
    }

    if (code.length !== 6) {

        showMessage(
            "Please enter a 6-character code.",
            "error"
        );

        codeInput.focus();

        return;
    }

    accessBtn.disabled = true;
    accessBtn.textContent = "Checking...";

    try {

        const response = await fetch(
            `/api/code/${encodeURIComponent(code)}`
        );

        const data = await getResponseData(response);

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Code not found."
            );
        }

        // Show received content
        receivedContent.textContent =
            data.content;

        resultSection.classList.remove(
            "hidden"
        );

        accessBtn.disabled = false;
        accessBtn.textContent =
            "Access Content";

        showMessage(
            "Content received successfully.",
            "success"
        );

    } catch (error) {

        console.error("Access error:", error);

        accessBtn.disabled = false;
        accessBtn.textContent =
            "Access Content";

        resultSection.classList.add(
            "hidden"
        );

        showMessage(
            error.message || "Unable to access code.",
            "error"
        );
    }
});


// =========================
// COPY RECEIVED CONTENT
// =========================

copyReceivedBtn.addEventListener(
    "click",
    async () => {

        const content =
            receivedContent.textContent;

        if (!content) {

            showMessage(
                "There is no content to copy.",
                "error"
            );

            return;
        }

        try {

            await navigator.clipboard.writeText(
                content
            );

            copyReceivedBtn.textContent =
                "Copied!";

            setTimeout(() => {

                copyReceivedBtn.textContent =
                    "Copy Content";

            }, 1500);

        } catch (error) {

            console.error(
                "Copy content error:",
                error
            );

            showMessage(
                "Unable to copy content.",
                "error"
            );
        }
    }
);


// =========================
// CLEAR RESULT
// =========================

clearResultBtn.addEventListener(
    "click",
    () => {

        receivedContent.textContent = "";

        resultSection.classList.add(
            "hidden"
        );

        codeInput.value = "";

        codeInput.focus();
    }
);


// =========================
// CODE INPUT
// =========================

codeInput.addEventListener(
    "input",
    () => {

        // Accept only values that could be generated by QuickCode.
        codeInput.value =
            codeInput.value.replace(/[^A-Za-z0-9]/g, "");

        // Keep maximum 6 characters
        codeInput.value =
            codeInput.value.substring(0, 6);
    }
);


// =========================
// ENTER KEY
// =========================

codeInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            accessBtn.click();
        }
    }
);
