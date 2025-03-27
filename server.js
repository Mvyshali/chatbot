require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected users
let users = {};

io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    socket.on("join", ({ username }) => {
        users[socket.id] = username;
        console.log(`${username} joined`);
    });

    socket.on("message", ({ sender, receiver, message }) => {
        io.emit("message", { sender, message }); // Broadcast to both users
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const AWS = require("aws-sdk");
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const saveMessage = async (sender, receiver, message) => {
    const params = {
        TableName: "ChatMessages",
        Item: {
            messageId: Date.now().toString(),
            sender,
            receiver,
            message,
            timestamp: new Date().toISOString(),
        },
    };
    await dynamoDB.put(params).promise();
};
socket.on("message", async ({ sender, receiver, message }) => {
    await saveMessage(sender, receiver, message);
    io.emit("message", { sender, message });
});
