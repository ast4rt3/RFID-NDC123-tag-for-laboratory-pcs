const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'RFID NDC123 Server',
  description: 'RFID NDC123 Laboratory PC Monitoring Server',
  script: path.join(__dirname, 'start-server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function(){
  console.log('✅ Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', function(){
  console.log('✅ Service started successfully!');
  console.log('Server is now running as a Windows Service.');
  console.log('You can manage it from Services (services.msc)');
});

svc.on('error', function(err){
  console.error('❌ Service error:', err);
});

// Install the service
console.log('Installing RFID NDC123 Server as Windows Service...');
svc.install();


