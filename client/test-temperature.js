/**
 * Test script to diagnose temperature reading issues
 * Runs all 4 temperature reading methods and shows which ones work
 */

const WindowsHardwareMonitor = require('./windows-hardware-monitor');

async function testAllMethods() {
    console.log('='.repeat(60));
    console.log('TEMPERATURE DIAGNOSTIC TEST');
    console.log('='.repeat(60));
    console.log();

    const monitor = new WindowsHardwareMonitor();

    // Test Method 1: WMI MSAcpi_ThermalZoneTemperature
    console.log('Method 1: Testing WMI MSAcpi_ThermalZoneTemperature...');
    const wmiTemp = await monitor.getCpuTempFromWMI();
    console.log(`Result: ${wmiTemp !== null ? wmiTemp + '°C' : 'FAILED'}`);
    console.log();

    // Test Method 2: Open Hardware Monitor WMI
    console.log('Method 2: Testing Open Hardware Monitor WMI...');
    const ohmTemp = await monitor.getCpuTempFromOHM();
    console.log(`Result: ${ohmTemp !== null ? ohmTemp + '°C' : 'FAILED'}`);
    console.log();

    // Test Method 3: LibreHardwareMonitor WMI
    console.log('Method 3: Testing LibreHardwareMonitor WMI...');
    const lhmTemp = await monitor.getCpuTempFromLHM();
    console.log(`Result: ${lhmTemp !== null ? lhmTemp + '°C' : 'FAILED'}`);
    console.log();

    // Test Method 4: LibreHardwareMonitor DLL
    console.log('Method 4: Testing LibreHardwareMonitor DLL...');
    const dllTemp = await monitor.getCpuTempFromLHMDll();
    console.log(`Result: ${dllTemp !== null ? dllTemp + '°C' : 'FAILED'}`);
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    const methods = [
        { name: 'WMI MSAcpi', temp: wmiTemp },
        { name: 'Open Hardware Monitor WMI', temp: ohmTemp },
        { name: 'LibreHardwareMonitor WMI', temp: lhmTemp },
        { name: 'LibreHardwareMonitor DLL', temp: dllTemp }
    ];

    const workingMethods = methods.filter(m => m.temp !== null);
    if (workingMethods.length === 0) {
        console.log('❌ ALL METHODS FAILED');
        console.log();
        console.log('Recommendations:');
        console.log('1. Run this script as Administrator');
        console.log('2. Install and run LibreHardwareMonitor');
        console.log('3. In LibreHardwareMonitor, enable "Options > Enable WMI"');
    } else {
        console.log(`✅ ${workingMethods.length} method(s) working:`);
        workingMethods.forEach(m => {
            console.log(`   - ${m.name}: ${m.temp}°C`);
        });
    }
    console.log();

    // Test the main getAllData method
    console.log('Testing getAllData() (actual data collection)...');
    const allData = await monitor.getAllData();
    console.log('Result:', allData);
}

testAllMethods().catch(console.error);
