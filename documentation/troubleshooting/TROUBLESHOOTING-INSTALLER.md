# Troubleshooting Server Installer

If the installer closes immediately, try these solutions:

## Solution 1: Run from Command Prompt

1. Open **Command Prompt** (not PowerShell)
2. Navigate to the server directory:
   ```cmd
   cd "C:\path\to\your\server\folder"
   ```
3. Run the installer:
   ```cmd
   install-server.bat
   ```

This keeps the window open so you can see any error messages.

## Solution 2: Use Debug Version

1. Run `install-server-debug.bat` instead
2. This version shows more detailed information
3. It pauses at each step so you can see what's happening

## Solution 3: Check Prerequisites

The installer requires:

- **Node.js** (version 16.x or higher)
  - Download from: https://nodejs.org/
  - Make sure to check "Add to PATH" during installation
  - Restart your computer after installing Node.js

- **npm** (comes with Node.js)
  - Should be installed automatically with Node.js

### Verify Node.js Installation

Open Command Prompt and run:
```cmd
node --version
npm --version
```

If these commands don't work, Node.js is not installed or not in your PATH.

## Solution 4: Manual Installation

If the installer keeps failing, install manually:

1. **Open Command Prompt** in the server directory

2. **Install dependencies**:
   ```cmd
   npm install --production
   ```

3. **Create configuration file**:
   - Copy `server-config.env` or create a new one
   - Edit it with your settings

4. **Start the server**:
   ```cmd
   npm start
   ```

## Common Issues

### Issue: "Node.js is not recognized"
**Solution**: 
- Install Node.js from https://nodejs.org/
- Restart your computer
- Make sure Node.js is added to PATH

### Issue: "npm install fails"
**Solutions**:
- Check your internet connection
- Clear npm cache: `npm cache clean --force`
- Try: `npm install --production --verbose` to see detailed errors

### Issue: "Access denied" or permission errors
**Solutions**:
- Run Command Prompt as Administrator
- Or run the installer as Administrator (right-click > Run as administrator)

### Issue: Installer closes immediately
**Solutions**:
- Run from Command Prompt (not by double-clicking)
- Check if Node.js is installed
- Use the debug version: `install-server-debug.bat`

## Getting Help

If you're still having issues:

1. Run `install-server-debug.bat` and note the error messages
2. Check the error message carefully
3. Try manual installation (see Solution 4)
4. Make sure you're in the correct directory (where package.json is located)

## Quick Test

To quickly test if everything is set up correctly:

1. Open Command Prompt
2. Navigate to server directory
3. Run: `node --version` (should show version number)
4. Run: `npm --version` (should show version number)
5. Run: `npm install --production` (should install dependencies)
6. Run: `npm start` (should start the server)

If all these work, your server is ready!


