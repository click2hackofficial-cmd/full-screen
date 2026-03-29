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

// Serve index.html when someone visits /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

// Socket connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send dummy devices list
    socket.emit('devices_list', [
        { deviceId: 'device_001', deviceName: 'OnePlus 11', battery: 87 },
        { deviceId: 'device_002', deviceName: 'Samsung S23', battery: 62 }
    ]);
    
    socket.on('panel_command', (data) => {
        console.log('Command received:', data);
        // Broadcast to all other clients (for testing)
        socket.broadcast.emit('command_received', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});
