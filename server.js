const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing.");
}


const client = new MongoClient(MONGO_URI, {
    family: 4
});

// Generate a 6-character alphanumeric code
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

async function startServer() {
    await client.connect();

    const codes = client.db("quickcode").collection("codes");

    // Prevent duplicate codes, including when people create codes at the same time
    await codes.createIndex({ code: 1 }, { unique: true });

    io.on("connection", (socket) => {
        let requestCount = 0;

        const rateTimer = setInterval(() => {
            requestCount = 0;
        }, 60000);

        socket.on("createCode", async (content) => {
            if (requestCount >= 30) {
                socket.emit("errorMessage", "Too many requests. Please wait.");
                return;
            }

            requestCount++;

            if (typeof content !== "string" || content.trim() === "") {
                socket.emit("errorMessage", "Please enter some content.");
                return;
            }

            try {
                let code;

                // Keep trying if a randomly generated code already exists
                while (true) {
                    code = generateCode(6);

                    try {
                        await codes.insertOne({ code, content });
                        break;
                    } catch (error) {
                        if (error.code !== 11000) {
                            throw error;
                        }
                    }
                }

                socket.emit("codeCreated", code);
            } catch (error) {
                console.error("Could not create code:", error);
                socket.emit(
                    "errorMessage",
                    "Could not save your content. Please try again."
                );
            }
        });

        socket.on("accessCode", async (code) => {
            if (requestCount >= 30) {
                socket.emit("errorMessage", "Too many requests. Please wait.");
                return;
            }

            requestCount++;

            if (typeof code !== "string") {
                socket.emit("errorMessage", "Code not found.");
                return;
            }

            try {
                const data = await codes.findOne({ code: code.trim() });

                if (!data) {
                    socket.emit("errorMessage", "Code not found.");
                    return;
                }

                // The code is intentionally not deleted and never expires.
                socket.emit("contentReceived", data.content);
            } catch (error) {
                console.error("Could not access code:", error);
                socket.emit(
                    "errorMessage",
                    "Could not retrieve content. Please try again."
                );
            }
        });

        socket.on("disconnect", () => {
            clearInterval(rateTimer);
        });
    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`QuickCode running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
});