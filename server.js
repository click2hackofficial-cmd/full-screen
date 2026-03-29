const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("panel_command", (data) => {
        console.log("Command:", data);
    });

    socket.emit("devices_list", []);
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
