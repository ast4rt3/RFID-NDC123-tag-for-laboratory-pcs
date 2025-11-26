/**
 * Script to download LibreHardwareMonitor for bundling with the installer
 * This will download the latest release and extract it to the resources folder
 */

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

/**
 * Try to safely remove the existing LibreHardwareMonitor directory.
 * On Windows this can fail with EBUSY/EPERM if the EXE or DLL is in use.
 * In that case we keep the existing install and skip re-download so builds don't break.
 */
function tryCleanOldLHM() {
  if (!fs.existsSync(LHM_DIR)) {
    return true;
  }

  console.log('🧹 Found existing LibreHardwareMonitor directory, attempting cleanup...');

  // Best-effort: try to stop any running LibreHardwareMonitor.exe so Windows unlocks the files
  try {
    execSync('taskkill /F /IM LibreHardwareMonitor.exe /T', {
      stdio: 'ignore',
      windowsHide: true
    });
    // Give Windows a brief moment to release file locks
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  } catch {
    // Ignore errors - process might not be running
  }

  try {
    fs.rmSync(LHM_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned up old LibreHardwareMonitor');
    return true;
  } catch (err) {
    if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
      console.warn('⚠️  Could not fully delete LibreHardwareMonitor directory because files are in use.');

      const exePath = path.join(LHM_DIR, 'LibreHardwareMonitor.exe');
      if (fs.existsSync(exePath)) {
        console.log('✅ Existing LibreHardwareMonitor installation detected, reusing it for build.');
        console.log('   If you want to force a fresh download, close any running LibreHardwareMonitor/client processes and delete:');
        console.log(`   ${LHM_DIR}`);
        // Reuse current installation, skip download
        process.exit(0);
      }

      console.error('❌ LibreHardwareMonitor directory is locked and no valid executable was found.');
      console.error('   Please close any running LibreHardwareMonitor or RFID client processes and try again.');
    } else {
      console.error('❌ Failed to remove existing LibreHardwareMonitor directory:', err.message);
    }
    process.exit(1);
  }
}

// Clean up old LibreHardwareMonitor if exists (or reuse if locked but valid)
tryCleanOldLHM();

// Fetch latest release info
console.log('🔍 Fetching latest LibreHardwareMonitor release...');

// Use GitHub API via curl (more robust than bare https in some Windows environments)
try {
  const json = execSync(`curl -sL -H "User-Agent: RFID-Client-Installer" "${GITHUB_API}"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const release = JSON.parse(json);
  const version = release.tag_name;

  // Find the .net472 zip file (works on most Windows systems)
  const asset = (release.assets || []).find(a =>
    a.name && a.name.includes('net472') && a.name.endsWith('.zip')
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
  console.error('❌ Failed to fetch release info:', err.message);
  process.exit(1);
}

