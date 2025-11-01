/**
 * Script to download LibreHardwareMonitor for bundling with the installer
 * This will download the latest release and extract it to the resources folder
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const GITHUB_API = 'https://api.github.com/repos/LibreHardwareMonitor/LibreHardwareMonitor/releases/latest';
const RESOURCES_DIR = path.join(__dirname, 'resources');
const LHM_DIR = path.join(RESOURCES_DIR, 'LibreHardwareMonitor');

console.log('📦 Downloading LibreHardwareMonitor for bundling...\n');

// Create resources directory if it doesn't exist
if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR);
  console.log('✅ Created resources directory');
}

// Clean up old LibreHardwareMonitor if exists
if (fs.existsSync(LHM_DIR)) {
  fs.rmSync(LHM_DIR, { recursive: true, force: true });
  console.log('🧹 Cleaned up old LibreHardwareMonitor');
}

// Fetch latest release info
console.log('🔍 Fetching latest LibreHardwareMonitor release...');

const options = {
  headers: {
    'User-Agent': 'RFID-Client-Installer'
  }
};

https.get(GITHUB_API, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const release = JSON.parse(data);
      const version = release.tag_name;
      
      // Find the .net472 zip file (works on most Windows systems)
      const asset = release.assets.find(a => 
        a.name.includes('net472') && a.name.endsWith('.zip')
      );

      if (!asset) {
        console.error('❌ Could not find LibreHardwareMonitor .net472 release');
        process.exit(1);
      }

      console.log(`✅ Found version: ${version}`);
      console.log(`📥 Downloading: ${asset.name}`);
      console.log(`   Size: ${(asset.size / 1024 / 1024).toFixed(2)} MB\n`);

      const zipPath = path.join(RESOURCES_DIR, asset.name);

      // Download using PowerShell (more reliable on Windows)
      try {
        console.log('📥 Downloading using PowerShell...');
        const downloadCmd = `powershell -Command "Invoke-WebRequest -Uri '${asset.browser_download_url}' -OutFile '${zipPath}'"`;
        execSync(downloadCmd, { stdio: 'inherit' });

        console.log('\n✅ Download complete!\n');

        // Extract the zip file
        console.log('📂 Extracting LibreHardwareMonitor...');

        // Create extraction directory
        fs.mkdirSync(LHM_DIR, { recursive: true });

        // Use adm-zip to extract
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(LHM_DIR, true);

        console.log('✅ Extraction complete!');
        console.log(`📁 LibreHardwareMonitor installed to: ${LHM_DIR}\n`);

        // Verify the executable exists
        const exePath = path.join(LHM_DIR, 'LibreHardwareMonitor.exe');
        if (fs.existsSync(exePath)) {
          console.log('✅ LibreHardwareMonitor.exe found!');
          console.log('\n🎉 Ready to bundle with installer!\n');

          // Create a version info file
          fs.writeFileSync(
            path.join(LHM_DIR, 'version.txt'),
            `LibreHardwareMonitor ${version}\nDownloaded: ${new Date().toISOString()}`
          );
        } else {
          console.error('❌ LibreHardwareMonitor.exe not found after extraction');
          process.exit(1);
        }

        // Clean up zip file
        try {
          fs.unlinkSync(zipPath);
        } catch (err) {
          console.log('⚠️  Could not delete zip file (not critical)');
        }

      } catch (err) {
        console.error('❌ Download or extraction failed:', err.message);
        process.exit(1);
      }

    } catch (err) {
      console.error('❌ Failed to parse GitHub API response:', err.message);
      process.exit(1);
    }
  });

}).on('error', (err) => {
  console.error('❌ Failed to fetch release info:', err.message);
  process.exit(1);
});

