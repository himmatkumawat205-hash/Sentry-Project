
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // tighten this to your actual frontend URL in production
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URI = process.env.MONGO_URI?.trim();

if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI environment variable is missing.");
    process.exit(1);
}

try {
    const parsedMongoUri = new URL(MONGO_URI);

    if (
        !["mongodb:", "mongodb+srv:"].includes(parsedMongoUri.protocol) ||
        !parsedMongoUri.hostname
    ) {
        throw new Error("Invalid MongoDB URI");
    }
} catch {
    console.error(
        "ERROR: MONGO_URI must be a complete MongoDB connection string, starting with mongodb:// or mongodb+srv://."
    );
    process.exit(1);
}

// QuickCode Schema
const quickCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const QuickCode = mongoose.model("QuickCode", quickCodeSchema);

// Generate 6-character alphanumeric code
function generateCode() {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return code;
}

// Create a new QuickCode
app.post("/api/create", async (req, res) => {
    try {
        const { content } = req.body;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter some content.",
            });
        }

        // The unique index is the source of truth. Retrying on a duplicate-key
        // error keeps simultaneous requests from ever receiving the same code.
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = generateCode();

            try {
                await QuickCode.create({ code, content });
                return res.status(201).json({ success: true, code });
            } catch (error) {
                if (error?.code !== 11000) {
                    throw error;
                }
            }
        }

        return res.status(503).json({
            success: false,
            message: "Unable to generate a unique code. Please try again.",
        });
    } catch (error) {
        console.error("Create error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create QuickCode.",
        });
    }
});

// Receive content using code
app.get("/api/code/:code", async (req, res) => {
    try {
        const code = req.params.code?.trim();

        if (!/^[A-Za-z0-9]{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 6-character code.",
            });
        }

        const quickCode = await QuickCode.findOne({ code });

        if (!quickCode) {
            return res.status(404).json({
                success: false,
                message: "Code not found.",
            });
        }

        // Content is NOT deleted after access
        res.json({
            success: true,
            code: quickCode.code,
            content: quickCode.content,
        });
    } catch (error) {
        console.error("Receive error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve content.",
        });
    }
});

// Main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, req, res, next) => {
    if (error?.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Content is too large. Please keep it under 100 KB.",
        });
    }

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({
            success: false,
            message: "Request body must be valid JSON.",
        });
    }

    next(error);
});

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`QuickCode running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exitCode = 1;
    }
}

startServer();
