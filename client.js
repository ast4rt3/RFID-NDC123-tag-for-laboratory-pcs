const WebSocket = require('ws');

const pcName = 'Lab-PC-01'; // Change per PC
const socket = new WebSocket('ws://localhost:8080');

socket.on('open', () => {
  console.log('Connected to server');
  socket.send(JSON.stringify({ type: 'start', pc_name: pcName }));

  // Simulate PC running for 10 seconds
  setTimeout(() => {
    socket.send(JSON.stringify({ type: 'stop', pc_name: pcName }));
    socket.close();
  }, 10000);
});
