const fs = require('fs');
const si = require('systeminformation');

async function testDiskInfo() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        log('--- si.fsSize() ---');
        const fsSize = await si.fsSize();
        log(JSON.stringify(fsSize, null, 2));

        log('\n--- si.blockDevices() ---');
        const blockDevices = await si.blockDevices();
        log(JSON.stringify(blockDevices, null, 2));

        log('\n--- si.diskLayout() ---');
        const diskLayout = await si.diskLayout();
        log(JSON.stringify(diskLayout, null, 2));

        // Attempt mapping
        log('\n--- Mapping Attempt ---');
        fsSize.forEach(fs => {
            // Find matching block device by mount point
            // blockDevices.mount is usually the mount point (e.g. "C:")
            const device = blockDevices.find(bd => bd.mount === fs.mount || bd.name === fs.fs);

            let model = 'Unknown';
            if (device) {
                // If we found a block device, it might have the model directly, or we might need to link to diskLayout
                // blockDevices often has 'model' or 'label'
                model = device.model || 'Unknown Model';

                if (device.physical) {
                    const physicalDisk = blockDevices.find(bd => bd.physical === device.physical && bd.type === 'disk');
                    if (physicalDisk) {
                        log(`  Found physical disk for ${fs.mount}: ${JSON.stringify(physicalDisk)}`);
                        if (physicalDisk.model) model = physicalDisk.model;
                    }
                }
            }

            log(`Mount: ${fs.mount} -> Model: ${model}`);
        });

        fs.writeFileSync('disk-debug.txt', output.join('\n'));
        console.log('Output written to disk-debug.txt');

    } catch (e) {
        console.error(e);
    }
}

testDiskInfo();
