const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Store shared content
const codes = new Map();

// Generate random alphanumeric code
function generateCode(length = 8) {
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

app.use(express.static("public"));

io.on("connection", (socket) => {

    // Sender creates a code
    socket.on("createCode", (content) => {

        if (!content || content.trim() === "") {
            socket.emit("errorMessage", "Please enter some content.");
            return;
        }

        let code;

        do {
            code = generateCode();
        } while (codes.has(code));

        codes.set(code, {
            content: content,
            createdAt: Date.now()
        });

        socket.emit("codeCreated", code);
    });

    // Receiver accesses code
    socket.on("accessCode", (code) => {

        code = code.trim();

        if (!codes.has(code)) {
            socket.emit("errorMessage", "Code not found.");
            return;
        }

        const data = codes.get(code);

        socket.emit("contentReceived", data.content);
    });
});

// Delete codes older than 1 hour
setInterval(() => {

    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    for (const [code, data] of codes.entries()) {

        if (now - data.createdAt > oneHour) {
            codes.delete(code);
        }
    }

}, 60 * 1000);

server.listen(PORT, () => {
    console.log(`QuickCode running at http://localhost:${PORT}`);
});

