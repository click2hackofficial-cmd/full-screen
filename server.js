const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: "*" }
});

// Serve static files
app.use(express.static(__dirname));

// Socket connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send dummy devices list (actual me aap apne devices yahan se bhejenge)
    socket.emit('devices_list', [
        { deviceId: 'device_001', deviceName: 'OnePlus 11', battery: 87 },
        { deviceId: 'device_002', deviceName: 'Samsung S23', battery: 62 }
    ]);
    
    socket.on('panel_command', (data) => {
        console.log('Command:', data);
        // Yahan aap actual device control logic lagaenge
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});
