# APPENDIX C: USER MANUAL & INSTALLATION GUIDE

## C.1 System Requirements

Before deploying the **RFID-Integrated Laboratory PC Monitoring System**, ensure the following prerequisites are met:

### Hardware Requirements
*   **Server:** PC or Cloud Instance with at least 2GB RAM, 2 vCPUs.
*   **Client Workstations:** Windows 10/11 PCs (x64 architecture).
*   **RFID Hardware:** USB RFID Reader (HID Mode) and 13.56 MHz RFID Tags.
*   **Network:** Local Area Network (LAN) with stable connection between clients and server.

### Software Requirements
*   **Node.js:** Version 16.0 or higher (LTS recommended).
*   **Git:** For cloning the repository.
*   **Database:** Supabase account (or local SQLite for testing).
*   **Visual Studio Build Tools:** Required for compiling native modules (windows-build-tools).

---

## C.2 Installation Instructions

### Step 1: Clone the Repository
Open a terminal and run:
```bash
git clone https://github.com/your-repo/rfid-lab-monitor.git
cd rfid-lab-monitor
```

### Step 2: Install Dependencies
Install the required Node.js packages for both client and server:
```bash
npm install
```
*Note: This may take a few minutes as it compiles native modules like `active-win` and `sqlite3`.*

### Step 3: Configure the Database
1.  Create a new project on **Supabase**.
2.  Go to the **SQL Editor** in Supabase and run the content of `server/supabase-schema.sql` to create the necessary tables.
3.  Get your **Project URL** and **Anon Key** from Project Settings > API.

### Step 4: Environment Configuration
Create a `.env` file in the root directory:
```ini
# Server Port
PORT=3000
WS_PORT=8080

# Database Credentials
DB_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Client Configuration
Edit `client/config.json` (or `resources/config.json` after build) to point to your server:
```json
{
  "serverIP": "192.168.1.100",
  "serverPort": 8080
}
```
*Replace `192.168.1.100` with the actual IP address of your server.*

---

## C.3 Running the System

### Starting the Server
On the server machine, run:
```bash
npm run start-server
```
You should see: `✅ Server started - ws://192.168.1.xxx:8080`

### Running the Client (Development)
On a client workstation, run:
```bash
npm run start-client
```

### Building the Client Installer
To create a deployable `.exe` installer for lab PCs:
```bash
npm run build-installer
```
The installer will be generated in the `dist/` folder. Run this installer on every lab PC.

---

## C.4 User Manual

### C.4.1 For Administrators (Dashboard)
1.  **Accessing the Dashboard:** Open a web browser and navigate to `http://<server-ip>:3000/dashboard` (or the deployed Netlify URL).
2.  **Monitoring Status:** The main view shows a grid of all PCs.
    *   **Green:** Online and Active.
    *   **Yellow:** Idle (No user input for >5 mins).
    *   **Red:** Offline.
3.  **Viewing Logs:** Click on any PC card to view detailed logs:
    *   **App Usage:** Timeline of applications used.
    *   **Browser History:** Search queries and educational sites visited.
    *   **Hardware Health:** CPU temperature and RAM usage graphs.

### C.4.2 For Lab Users/Students
1.  **Log In:** Turn on the PC. The client software starts automatically in the system tray.
2.  **RFID Scan:** Scan your ID card on the RFID reader.
    *   *Note: The current version uses RFID for dashboard status checks, not Windows login.*
3.  **Privacy:** The system monitors **active application titles** and **educational search queries**. It does **not** record keystrokes, passwords, or private messages.
4.  **Idle Mode:** If you step away for 5 minutes, the system marks the PC as "Idle".

---

## C.5 Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Client cannot connect** | Firewall blocking port 8080. | Allow Node.js through Windows Firewall on the server. |
| **"Internal Server Error"** | Database connection failed. | Check `.env` file and Supabase credentials. |
| **CPU Temp is "Null"** | Admin privileges missing. | Run the client/installer as Administrator. |
| **Native Module Error** | Node version mismatch. | Ensure you are using the same Node version to build and run. |
