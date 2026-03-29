
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// 🔥 ye add karo
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/panel.html");
});

io.on("connection", (socket) => {
    console.log("User connected");

    socket.emit("devices_list", []);
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
