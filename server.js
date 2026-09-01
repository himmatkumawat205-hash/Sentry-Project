const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI environment variable is missing.");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });

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

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter some content.",
            });
        }

        let code;
        let existingCode;

        // Make sure generated code is unique
        do {
            code = generateCode();
            existingCode = await QuickCode.findOne({ code });
        } while (existingCode);

        const quickCode = new QuickCode({
            code,
            content,
        });

        await quickCode.save();

        res.json({
            success: true,
            code,
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
        const code = req.params.code;

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

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuickCode running on port ${PORT}`);

});