const { autoUpdater } = require('electron-updater');
const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class AutoUpdater {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.updateAvailable = false;
        this.updateDownloaded = false;
        
        // Configure auto-updater - DISABLED for now
        // autoUpdater.checkForUpdatesAndNotify();
        
        // Set update server (you can host updates on GitHub, S3, or your own server)
        // autoUpdater.setFeedURL({
        //     provider: 'github',
        //     owner: 'yourusername',
        //     repo: 'your-repo'
        // });
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Check for updates on startup - DISABLED for now
        // autoUpdater.checkForUpdates();
        
        // Update available
        autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info);
            this.updateAvailable = true;
            
            // Show notification to user
            this.showUpdateNotification(info);
        });
        
        // Update downloaded
        autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded:', info);
            this.updateDownloaded = true;
            
            // Ask user to restart
            this.showRestartDialog(info);
        });
        
        // Update error
        autoUpdater.on('error', (error) => {
            console.error('Auto-updater error:', error);
            // Don't show error to user for now, just log it
        });
        
        // No updates available
        autoUpdater.on('update-not-available', (info) => {
            console.log('No updates available:', info);
        });
        
        // Download progress
        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            console.log(log_message);
        });
    }
    
    showUpdateNotification(info) {
        // Show system notification or tray balloon
        if (this.mainWindow && this.mainWindow.tray) {
            this.mainWindow.tray.displayBalloon({
                title: 'RFID Monitor - Update Available',
                content: `Version ${info.version} is available. Click to download.`,
                icon: this.mainWindow.tray.getBounds ? this.mainWindow.tray.getBounds() : null
            });
        }
        
        // Add update option to tray menu
        this.updateTrayMenu();
    }
    
    showRestartDialog(info) {
        const options = {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded successfully',
            detail: `Version ${info.version} has been downloaded and is ready to install. The application will restart to apply the update.`,
            buttons: ['Restart Now', 'Restart Later'],
            defaultId: 0,
            cancelId: 1
        };
        
        dialog.showMessageBox(options).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    }
    
    updateTrayMenu() {
        if (this.mainWindow && this.mainWindow.updateTrayMenu) {
            this.mainWindow.updateTrayMenu();
        }
    }
    
    // Manual check for updates
    checkForUpdates() {
        autoUpdater.checkForUpdates();
    }
    
    // Get update status
    getUpdateStatus() {
        return {
            updateAvailable: this.updateAvailable,
            updateDownloaded: this.updateDownloaded
        };
    }
}

module.exports = AutoUpdater;
