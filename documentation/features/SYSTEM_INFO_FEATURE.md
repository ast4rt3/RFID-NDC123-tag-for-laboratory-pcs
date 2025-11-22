# System Information Feature

## 🎯 Overview

The RFID Laboratory PC Monitoring System now collects and stores **one-time system information** for each PC. This provides a comprehensive hardware profile that is stored once and updated only when the system changes.

### What's Collected

Each PC reports the following information **once on startup**:

| Field | Description | Example |
|-------|-------------|---------|
| `cpu_model` | CPU brand and model | "Intel(R) Core(TM) i3-8109U CPU @ 3.00GHz" |
| `cpu_cores` | Number of CPU cores | 4 |
| `cpu_speed_ghz` | CPU base speed in GHz | 3.0 |
| `total_memory_gb` | Total RAM in GB | 23.89 |
| `os_platform` | Operating system platform | "win32", "linux", "darwin" |
| `os_version` | OS version/distribution | "Windows 10 Pro" |
| `hostname` | Computer hostname | "LAB-PC-01" |

---

## 🆕 What Was Added

### 1. **Database Schema**

#### New Table: `system_info`
- Stores one record per PC (identified by `pc_name`)
- Uses `UNIQUE` constraint on `pc_name` to prevent duplicates
- Automatically updates `updated_at` timestamp on changes

#### SQLite Schema:
```sql
CREATE TABLE IF NOT EXISTS system_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL UNIQUE,
  cpu_model TEXT,
  cpu_cores INTEGER,
  cpu_speed_ghz REAL,
  total_memory_gb REAL,
  os_platform TEXT,
  os_version TEXT,
  hostname TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Supabase Schema:
```sql
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL UNIQUE,
    cpu_model VARCHAR(200),
    cpu_cores INTEGER,
    cpu_speed_ghz REAL,
    total_memory_gb REAL,
    os_platform VARCHAR(50),
    os_version VARCHAR(100),
    hostname VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **Client-Side Collection** (`client/pc-logger.js`)

Added `sendSystemInfo()` function that:
- Collects system information using `systeminformation` package
- Runs **once on WebSocket connection**
- Sends data to server via WebSocket
- Handles errors gracefully

### 3. **Server-Side Handling** (`server/server.js`)

Added handler for `system_info` message type:
- Receives system information from client
- Calls `db.upsertSystemInfo()` to store/update data
- Logs success/failure

### 4. **Database Methods**

#### `database.js`:
- Added `upsertSystemInfo()` method
- Uses `INSERT OR REPLACE` for SQLite
- Supports Supabase and memory storage

#### `supabase-client.js`:
- Added `upsertSystemInfo()` method
- Uses `upsert()` with `onConflict: 'pc_name'`

---

## 📊 How It Works

### Data Flow

```
Client Startup
     ↓
WebSocket connects to server
     ↓
sendSystemInfo() collects:
  - CPU model, cores, speed
  - Total memory
  - OS platform and version
  - Hostname
     ↓
Sends via WebSocket (type: 'system_info')
     ↓
Server receives message
     ↓
db.upsertSystemInfo() stores in database
     ↓
Data stored/updated in system_info table
```

### Key Features

1. **One-Time Collection**: Data is sent only once per client startup
2. **Upsert Logic**: Updates existing record if PC already exists
3. **No Iteration**: Unlike app usage logs, this is stored once per PC
4. **Automatic Updates**: If hardware changes, data is updated on next startup

---

## 🚀 Usage Examples

### View All System Information

#### SQLite:
```bash
sqlite3 server/local.db "SELECT * FROM system_info;"
```

#### Supabase:
```sql
SELECT * FROM system_info ORDER BY pc_name;
```

### Example Output:
```
pc_name     | cpu_model                                  | cpu_cores | cpu_speed_ghz | total_memory_gb | os_platform | os_version      | hostname
------------|-------------------------------------------|-----------|---------------|-----------------|-------------|-----------------|----------
LAB-PC-01   | Intel(R) Core(TM) i3-8109U CPU @ 3.00GHz | 4         | 3.0           | 23.89           | win32       | Windows 10 Pro  | LAB-PC-01
LAB-PC-02   | Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz | 6         | 2.9           | 16.00           | win32       | Windows 10 Pro  | LAB-PC-02
LAB-PC-03   | AMD Ryzen 5 3600 6-Core Processor        | 12        | 3.6           | 32.00           | win32       | Windows 11 Pro  | LAB-PC-03
```

### Query Examples

#### Find PCs with specific CPU:
```sql
SELECT pc_name, cpu_model, cpu_cores 
FROM system_info 
WHERE cpu_model LIKE '%i3%';
```

#### Find PCs with low memory:
```sql
SELECT pc_name, total_memory_gb 
FROM system_info 
WHERE total_memory_gb < 16 
ORDER BY total_memory_gb ASC;
```

#### Group by CPU cores:
```sql
SELECT cpu_cores, COUNT(*) as pc_count 
FROM system_info 
GROUP BY cpu_cores 
ORDER BY cpu_cores DESC;
```

#### Join with app usage to see hardware performance:
```sql
SELECT 
  s.pc_name,
  s.cpu_model,
  s.cpu_cores,
  s.total_memory_gb,
  AVG(a.cpu_percent) as avg_cpu_usage,
  AVG(a.memory_usage_bytes / 1024.0 / 1024.0 / 1024.0) as avg_memory_gb
FROM system_info s
LEFT JOIN app_usage_logs a ON s.pc_name = a.pc_name
GROUP BY s.pc_name, s.cpu_model, s.cpu_cores, s.total_memory_gb
ORDER BY s.pc_name;
```

---

## 🔄 Migration Instructions

### For Existing SQLite Databases
**Automatic!** The migration runs when the server starts.

The server will:
1. Check if `system_info` table exists
2. Create it if missing
3. Log the migration status

### For Existing Supabase Databases

Run the migration SQL in Supabase SQL Editor:

**File:** `migrate-supabase-system-info.sql`

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left menu
4. Paste the contents of `migrate-supabase-system-info.sql`
5. Click "Run"

**Or manually:**
```sql
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL UNIQUE,
    cpu_model VARCHAR(200),
    cpu_cores INTEGER,
    cpu_speed_ghz REAL,
    total_memory_gb REAL,
    os_platform VARCHAR(50),
    os_version VARCHAR(100),
    hostname VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_info_pc_name ON system_info(pc_name);
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on system_info" ON system_info FOR ALL USING (true);
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🧪 Testing

### Test System Info Collection

1. **Start the server:**
   ```bash
   npm run start-server
   ```

2. **Start a client:**
   ```bash
   npm run start-client
   ```

3. **Check server logs:**
   ```
   📊 Received system info from LAB-PC-01
   ✅ System info upserted for LAB-PC-01
   ```

4. **Query the database:**
   ```sql
   SELECT * FROM system_info WHERE pc_name = 'LAB-PC-01';
   ```

### Expected Result:
```
pc_name: LAB-PC-01
cpu_model: Intel(R) Core(TM) i3-8109U CPU @ 3.00GHz
cpu_cores: 4
cpu_speed_ghz: 3.0
total_memory_gb: 23.89
os_platform: win32
os_version: Windows 10 Pro
hostname: LAB-PC-01
created_at: 2025-11-01 10:30:00
updated_at: 2025-11-01 10:30:00
```

---

## 📈 Use Cases

### 1. **Hardware Inventory**
- Get a complete list of all lab PC hardware
- Identify PCs that need upgrades
- Track hardware changes over time

### 2. **Performance Analysis**
- Correlate hardware specs with performance metrics
- Identify bottlenecks (low RAM, slow CPU)
- Optimize resource allocation

### 3. **Capacity Planning**
- See which PCs can handle resource-intensive applications
- Plan hardware upgrades based on actual specs
- Balance workload across available hardware

### 4. **Compliance & Reporting**
- Generate hardware inventory reports
- Track OS versions for security compliance
- Document lab infrastructure

---

## ✅ Benefits

- **📊 Complete Hardware Profile**: Know exactly what hardware each PC has
- **🔄 Automatic Updates**: Data refreshes on client restart
- **💾 No Duplication**: One record per PC (upsert logic)
- **⚡ Minimal Overhead**: Collected only once on startup
- **🔍 Easy Querying**: Simple table structure for reports
- **📈 Historical Tracking**: `updated_at` shows when hardware changed

---

## 🎯 Summary

The system information feature provides a **one-time snapshot** of each PC's hardware configuration:

✅ **Collected once** on client startup  
✅ **Stored in dedicated table** (not repeated in logs)  
✅ **Automatically updated** if hardware changes  
✅ **Easy to query** for reports and analysis  
✅ **Works with SQLite and Supabase**  

**Example Display:**
```
Additional System Information:
  CPU Model: Intel(R) Core(TM) i3-8109U
  CPU Cores: 4
  CPU Speed: 3.0 GHz
  Total Memory: 23.89 GB
```

This data is now available in your database for inventory, reporting, and analysis! 🎉

