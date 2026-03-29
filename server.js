const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// HTML, CSS, JS फाइलों को सर्व करने के लिए
app.use(express.static(path.join(__dirname)));

// जब कोई यूजर वेबसाइट खोलेगा, तो index.html भेजें
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO कनेक्शन लॉजिक यहाँ आएगा
// यह सिर्फ एक उदाहरण है, आपको इसे अपने एंड्रॉइड ऐप के अनुसार बदलना होगा
io.on('connection', (socket) => {
  console.log('A user connected with id:', socket.id);

  // पैनल से आने वाले कमांड्स को सुनें
  socket.on('panel_command', (data) => {
    console.log(Command received for target ${data.targetId}:, data);
    // इस कमांड को सही एंड्रॉइड डिवाइस तक भेजें
    // आपको अपने एंड्रॉइड ऐप के लॉजिक के अनुसार इसे लागू करना होगा
  });

  // जब कोई यूजर डिस्कनेक्ट हो
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});
