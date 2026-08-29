const socket = io();


// =========================
// ELEMENTS
// =========================

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

const shareBtn =
    document.getElementById("shareBtn");

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

const clearResultBtn =
    document.getElementById("clearResultBtn");

const message =
    document.getElementById("message");


// =========================
// SHOW MESSAGE
// =========================

function showMessage(text, type = "success") {

    message.textContent = text;

    message.className =
        `message ${type}`;

    setTimeout(() => {
        message.className =
            "message hidden";
    }, 4000);
}


// =========================
// GENERATE CODE
// =========================

generateBtn.addEventListener("click", () => {

    const content =
        contentInput.value;

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

    socket.emit(
        "createCode",
        content
    );
});


// =========================
// CODE CREATED
// =========================

socket.on("codeCreated", (code) => {

    generatedCode.textContent =
        code;

    generatedSection.classList.remove(
        "hidden"
    );

    generateBtn.disabled = false;
    generateBtn.textContent =
        "Generate New Code";

    showMessage(
        "Your code was generated successfully.",
        "success"
    );
});


// =========================
// COPY GENERATED CODE
// =========================

copyBtn.addEventListener("click", async () => {

    const code =
        generatedCode.textContent;

    try {

        await navigator.clipboard.writeText(code);

        copyBtn.textContent =
            "Copied!";

        setTimeout(() => {
            copyBtn.textContent =
                "Copy";
        }, 1500);

    } catch {

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

    const code =
        generatedCode.textContent;

    const shareText =
        `QuickCode access code: ${code}`;

    if (navigator.share) {

        try {

            await navigator.share({
                title: "QuickCode",
                text: shareText
            });

        } catch {
            // User cancelled sharing
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

        } catch {

            showMessage(
                "Unable to share code.",
                "error"
            );
        }
    }
});


// =========================
// ACCESS CODE
// =========================

accessBtn.addEventListener("click", () => {

    const code =
        codeInput.value.trim();

    if (!code) {

        showMessage(
            "Please enter your access code.",
            "error"
        );

        codeInput.focus();

        return;
    }

    accessBtn.disabled = true;
    accessBtn.textContent = "Checking...";

    socket.emit(
        "accessCode",
        code
    );
});


// =========================
// CONTENT RECEIVED
// =========================

socket.on("contentReceived", (content) => {

    receivedContent.textContent =
        content;

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
});


// =========================
// COPY CONTENT
// =========================

copyReceivedBtn.addEventListener(
    "click",
    async () => {

        const content =
            receivedContent.textContent;

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

        } catch {

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

        showMessage(
            "Content cleared.",
            "success"
        );
    }
);


// =========================
// CODE INPUT
// =========================

codeInput.addEventListener(
    "input",
    () => {

        // Remove spaces
        codeInput.value =
            codeInput.value.replace(/\s/g, "");

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


// =========================
// ERRORS
// =========================

socket.on("errorMessage", (error) => {

    generateBtn.disabled = false;
    generateBtn.textContent =
        "Generate Code";

    accessBtn.disabled = false;
    accessBtn.textContent =
        "Access Content";

    showMessage(
        error,
        "error"
    );
});