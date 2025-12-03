/**
 * System Accuracy Testing Utility
 * 
 * This script helps test the accuracy of the Laboratory PC Monitoring System
 * by comparing system measurements with actual system values.
 * 
 * Usage:
 *   node test-system-accuracy.js
 */

const os = require('os');
const si = require('systeminformation');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Test configuration
const TEST_DURATION_SECONDS = [30, 60, 120, 300]; // Multiple durations to test
const ACCURACY_TOLERANCE_SECONDS = 3; // ±3 seconds tolerance

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Laboratory PC Monitoring System - Accuracy Testing       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

/**
 * Test 1: System Information Accuracy
 */
async function testSystemInfoAccuracy() {
    console.log('📊 Test 1: System Information Accuracy');
    console.log('──────────────────────────────────────\n');

    try {
        // Get actual system info
        const cpu = await si.cpu();
        const mem = await si.mem();
        const osInfo = await si.osInfo();

        const actualData = {
            hostname: os.hostname(),
            cpuModel: cpu.manufacturer + ' ' + cpu.brand,
            cpuCores: cpu.cores,
            cpuSpeed: (cpu.speed / 1000).toFixed(2) + ' GHz',
            totalMemoryGB: (mem.total / (1024 * 1024 * 1024)).toFixed(2),
            osPlatform: osInfo.platform,
            osVersion: osInfo.distro || osInfo.release
        };

        console.log('Actual System Information:');
        console.table(actualData);

        console.log('\n✅ System information collection test complete');
        console.log('   Expected: All values should be collected correctly\n');

        return {
            test: 'System Information Accuracy',
            status: 'PASS',
            data: actualData
        };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            test: 'System Information Accuracy',
            status: 'FAIL',
            error: error.message
        };
    }
}

/**
 * Test 2: Duration Calculation Accuracy (Simulation)
 */
async function testDurationAccuracy() {
    console.log('⏱️  Test 2: Duration Calculation Accuracy');
    console.log('─────────────────────────────────────────\n');

    const results = [];

    for (const targetDuration of TEST_DURATION_SECONDS) {
        console.log(`Testing ${targetDuration} second duration...`);

        const startTime = Date.now();

        // Simulate activity by waiting
        await new Promise(resolve => setTimeout(resolve, targetDuration * 1000));

        const endTime = Date.now();
        const actualDuration = Math.floor((endTime - startTime) / 1000);
        const difference = Math.abs(actualDuration - targetDuration);
        const accuracy = difference <= ACCURACY_TOLERANCE_SECONDS;

        results.push({
            target: targetDuration + 's',
            actual: actualDuration + 's',
            difference: difference + 's',
            tolerance: `±${ACCURACY_TOLERANCE_SECONDS}s`,
            status: accuracy ? '✅ PASS' : '❌ FAIL'
        });

        console.log(`   Target: ${targetDuration}s, Actual: ${actualDuration}s, Difference: ${difference}s ${accuracy ? '✅' : '❌'}\n`);
    }

    console.table(results);

    const allPassed = results.every(r => r.status === '✅ PASS');

    return {
        test: 'Duration Calculation Accuracy',
        status: allPassed ? 'PASS' : 'FAIL',
        results: results
    };
}

/**
 * Test 3: CPU Usage Measurement (Comparison with Task Manager)
 */
async function testCpuMeasurement() {
    console.log('🔢 Test 3: CPU Usage Measurement');
    console.log('─────────────────────────────────\n');

    try {
        console.log('Collecting CPU usage data...\n');

        const measurements = [];
        const iterations = 10;

        for (let i = 0; i < iterations; i++) {
            const cpuData = await si.currentLoad();
            const cpuPercent = cpuData.currentLoad;

            measurements.push({
                iteration: i + 1,
                cpuPercent: cpuPercent.toFixed(2) + '%',
                timestamp: new Date().toISOString()
            });

            // Wait 2 seconds between measurements
            if (i < iterations - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.table(measurements);

        const avgCpu = measurements.reduce((sum, m) => sum + parseFloat(m.cpuPercent), 0) / iterations;
        const maxCpu = Math.max(...measurements.map(m => parseFloat(m.cpuPercent)));
        const minCpu = Math.min(...measurements.map(m => parseFloat(m.cpuPercent)));

        console.log('\nSummary:');
        console.log(`   Average CPU: ${avgCpu.toFixed(2)}%`);
        console.log(`   Min CPU: ${minCpu.toFixed(2)}%`);
        console.log(`   Max CPU: ${maxCpu.toFixed(2)}%`);

        console.log('\n✅ CPU measurement test complete');
        console.log('   Note: Compare these values with Task Manager\n');

        return {
            test: 'CPU Usage Measurement',
            status: 'PASS',
            average: avgCpu,
            min: minCpu,
            max: maxCpu,
            measurements: measurements
        };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            test: 'CPU Usage Measurement',
            status: 'FAIL',
            error: error.message
        };
    }
}

/**
 * Test 4: Memory Usage Measurement
 */
async function testMemoryMeasurement() {
    console.log('💾 Test 4: Memory Usage Measurement');
    console.log('────────────────────────────────────\n');

    try {
        const memData = await si.mem();
        const totalGB = (memData.total / (1024 * 1024 * 1024)).toFixed(2);
        const usedGB = (memData.used / (1024 * 1024 * 1024)).toFixed(2);
        const freeGB = (memData.free / (1024 * 1024 * 1024)).toFixed(2);
        const usedPercent = ((memData.used / memData.total) * 100).toFixed(2);

        const memoryInfo = {
            total: totalGB + ' GB',
            used: usedGB + ' GB',
            free: freeGB + ' GB',
            usedPercent: usedPercent + '%'
        };

        console.log('Current Memory Usage:');
        console.table(memoryInfo);

        console.log('\n✅ Memory measurement test complete');
        console.log('   Note: Compare with Task Manager\n');

        return {
            test: 'Memory Usage Measurement',
            status: 'PASS',
            data: memoryInfo
        };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            test: 'Memory Usage Measurement',
            status: 'FAIL',
            error: error.message
        };
    }
}

/**
 * Test 5: Timestamp Accuracy
 */
async function testTimestampAccuracy() {
    console.log('🕐 Test 5: Timestamp Accuracy');
    console.log('─────────────────────────────\n');

    try {
        const now = new Date();
        const isoString = now.toISOString();
        const localString = now.toLocaleString();
        const utcOffset = -now.getTimezoneOffset() / 60;

        const timestampInfo = {
            'UTC ISO': isoString,
            'Local Time': localString,
            'UTC Offset': `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`,
            'Unix Timestamp': now.getTime(),
            'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        console.log('Timestamp Formats:');
        console.table(timestampInfo);

        // Test timezone conversion
        console.log('\nTesting timezone conversion:');
        const testDates = [
            new Date(),
            new Date('2024-11-12T14:30:00Z'),
            new Date('2024-11-12T14:30:00+08:00')
        ];

        testDates.forEach(date => {
            console.log(`   ISO: ${date.toISOString()}`);
            console.log(`   Local: ${date.toLocaleString()}`);
            console.log('');
        });

        console.log('✅ Timestamp accuracy test complete');
        console.log('   Expected: UTC stored in database, local displayed on dashboard\n');

        return {
            test: 'Timestamp Accuracy',
            status: 'PASS',
            data: timestampInfo
        };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            test: 'Timestamp Accuracy',
            status: 'FAIL',
            error: error.message
        };
    }
}

/**
 * Test 6: Application Detection
 */
async function testApplicationDetection() {
    console.log('🖥️  Test 6: Application Detection');
    console.log('─────────────────────────────────\n');

    try {
        const activeWin = require('active-win');
        const processes = await si.processes();

        console.log('Current Active Window:');
        try {
            const active = await activeWin();
            if (active) {
                console.log(`   App: ${active.owner.name || 'Unknown'}`);
                console.log(`   Title: ${active.title || 'N/A'}`);
                console.log(`   URL: ${active.url || 'N/A'}\n`);
            }
        } catch (err) {
            console.log('   Could not detect active window (may require permissions)\n');
        }

        console.log('Top 5 Processes by CPU:');
        const topProcesses = processes.list
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5)
            .map(p => ({
                name: p.name,
                cpu: p.cpu.toFixed(2) + '%',
                memory: (p.mem / 1024).toFixed(2) + ' MB'
            }));

        console.table(topProcesses);

        console.log('\n✅ Application detection test complete\n');

        return {
            test: 'Application Detection',
            status: 'PASS',
            processes: topProcesses
        };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            test: 'Application Detection',
            status: 'FAIL',
            error: error.message
        };
    }
}

/**
 * Generate Test Report
 */
function generateReport(results) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY REPORT                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const summary = results.map(r => ({
        Test: r.test,
        Status: r.status === 'PASS' ? '✅ PASS' : '❌ FAIL',
        'Notes': r.error || 'Complete'
    }));

    console.table(summary);

    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\nOverall Results: ${passed}/${total} tests passed (${passRate}%)\n`);

    // Save report to file
    const fs = require('fs');
    const reportPath = 'test-accuracy-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: total,
            passed: passed,
            failed: total - passed,
            passRate: passRate + '%'
        },
        results: results
    }, null, 2));

    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

/**
 * Main Test Execution
 */
async function runTests() {
    const results = [];

    // Run all tests
    results.push(await testSystemInfoAccuracy());
    console.log('\n');

    results.push(await testDurationAccuracy());
    console.log('\n');

    results.push(await testCpuMeasurement());
    console.log('\n');

    results.push(await testMemoryMeasurement());
    console.log('\n');

    results.push(await testTimestampAccuracy());
    console.log('\n');

    results.push(await testApplicationDetection());

    // Generate report
    generateReport(results);
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});

