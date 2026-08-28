const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Store shared content
const codes = new Map();

// Generate 6-character alphanumeric code
function generateCode(length = 6) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let code = "";

    for (let i = 0; i < length; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return code;
}

// Serve website files
app.use(express.static("public"));


// Socket.IO connection
io.on("connection", (socket) => {

    // Basic rate protection
    let requestCount = 0;

    const rateTimer = setInterval(() => {
        requestCount = 0;
    }, 60000);


    // =========================
    // CREATE CODE
    // =========================

    socket.on("createCode", (content) => {

        // Rate protection
        if (requestCount >= 30) {
            socket.emit(
                "errorMessage",
                "Too many requests. Please wait."
            );
            return;
        }

        requestCount++;


        // Check empty content
        if (!content || content.trim() === "") {
            socket.emit(
                "errorMessage",
                "Please enter some content."
            );
            return;
        }


        // Generate unique 6-character code
        let code;

        do {
            code = generateCode(6);
        } while (codes.has(code));


        // Store content
        codes.set(code, {
            content: content
        });


        // Send generated code to sender
        socket.emit("codeCreated", code);

    });


    // =========================
    // ACCESS CODE
    // =========================

    socket.on("accessCode", (code) => {

        // Rate protection
        if (requestCount >= 30) {
            socket.emit(
                "errorMessage",
                "Too many requests. Please wait."
            );
            return;
        }

        requestCount++;


        // Clean input
        code = code.trim();


        // Check code
        if (!codes.has(code)) {
            socket.emit(
                "errorMessage",
                "Code not found."
            );
            return;
        }


        // Get stored content
        const data = codes.get(code);


        // Send content to receiver
        socket.emit(
            "contentReceived",
            data.content
        );

        // IMPORTANT:
        // Code is NOT deleted.
        // Multiple people can use the same code.

    });


    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {
        clearInterval(rateTimer);
    });

});


// =========================
// START SERVER
// =========================

server.listen(PORT, "0.0.0.0", () => {
    console.log(`QuickCode running on port ${PORT}`);
});