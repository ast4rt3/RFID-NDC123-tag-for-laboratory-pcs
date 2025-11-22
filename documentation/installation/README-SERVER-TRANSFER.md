# Quick Server Transfer Guide

## Fast Transfer Method

### Step 1: Copy Files
Copy these to the new machine:
- `server/` folder
- `package.json`
- `start-server.js`
- `server-config.env` (or create new one)
- `install-server.bat`

### Step 2: Run Installer
1. Right-click `install-server.bat`
2. Select "Run as administrator"
3. Wait for installation to complete

### Step 3: Configure
1. Edit `server-config.env`
2. Set your database type and credentials

### Step 4: Start Server
- Double-click `start-server.bat`
- Or run: `npm start`

## What Gets Installed

✅ Node.js check and verification  
✅ npm dependencies installation  
✅ Configuration file setup  
✅ Startup scripts creation  
✅ Optional Windows Service installer  

## Configuration Options

**Memory Storage** (default, no setup needed):
```env
DB_TYPE=memory
```

**SQLite** (local file database):
```env
DB_TYPE=sqlite
```

**Supabase** (cloud database):
```env
DB_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
```

## Server Access

Once running:
- **Status Page**: http://localhost:3000/status-page
- **API**: http://localhost:3000/logs
- **WebSocket**: ws://localhost:8080

## Need Help?

See `SERVER_INSTALLATION_GUIDE.md` for detailed instructions.

