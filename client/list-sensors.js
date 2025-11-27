/**
 * List all available temperature sensors from LibreHardwareMonitor WMI
 * This helps identify which sensor is being read
 */

const { exec } = require('child_process');

function listAllTemperatureSensors() {
    const cmd = `powershell -Command "Get-WmiObject -Namespace root/LibreHardwareMonitor -Class Sensor | Where-Object {$_.SensorType -eq 'Temperature'} | Select-Object Name, Value, Identifier | Format-Table -AutoSize"`;

    console.log('Querying all temperature sensors from LibreHardwareMonitor WMI...\n');

    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err || stderr) {
            console.error('❌ Error:', stderr || err.message);
            return;
        }

        console.log('Available Temperature Sensors:');
        console.log('='.repeat(80));
        console.log(stdout);
        console.log('='.repeat(80));
        console.log('\nThe client is currently configured to read the FIRST sensor');
        console.log('that matches: Name contains "CPU"');
        console.log('\nCheck which sensor matches your LibreHardwareMonitor GUI reading.');
    });
}

listAllTemperatureSensors();
