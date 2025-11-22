# Windows Hardware Monitoring Feature

## Overview
The RFID Laboratory PC Monitoring System now includes comprehensive hardware monitoring capabilities optimized for Windows systems. This feature monitors CPU temperature, detects CPU overclocking, and detects RAM overclocking in real-time, storing all data alongside other system metrics like CPU usage, GPU usage, and memory consumption.

## What Was Added

### 1. **Windows Hardware Monitor Module** (`client/windows-hardware-monitor.js`) 🆕
- Created dedicated Windows hardware monitoring class
- Implements multiple methods for CPU temperature detection:
  - WMI MSAcpi_ThermalZoneTemperature (native Windows)
  - Open Hardware Monitor WMI namespace
  - LibreHardwareMonitor WMI namespace
- CPU overclocking detection via WMI (compares current vs max clock speed)
- RAM overclocking detection via WMI (compares against JEDEC standard speeds)
- Built-in caching mechanism (5 seconds for temperature, 30 seconds for overclocking)
- Graceful fallback when hardware monitoring is not available

### 2. **Client-Side Changes** (`client/pc-logger.js`)
- Added `systeminformation` package for cross-platform hardware monitoring
- Added `WindowsHardwareMonitor` for Windows-specific optimizations
- Created `getCpuTemperature()` function with Windows-first approach
- Created `getHardwareData()` function to collect all hardware metrics at once
- Updated all app usage tracking events to include hardware monitoring data:
  - `app_usage_start` - includes cpu_temperature, is_cpu_overclocked, is_ram_overclocked
  - `app_usage_end` - includes cpu_temperature, is_cpu_overclocked, is_ram_overclocked
  - `app_usage_update` - includes cpu_temperature, is_cpu_overclocked, is_ram_overclocked

### 3. **Server-Side Changes** (`server/server.js`)
- Updated WebSocket message handlers to accept new parameters:
  - `cpu_temperature`
  - `is_cpu_overclocked`
  - `is_ram_overclocked`
- Modified `db.insertAppUsageLog()` calls to include all hardware monitoring data

### 4. **Database Schema Updates**

#### SQLite (`server/database.js`)
- Added `cpu_temperature REAL` column to `app_usage_logs` table
- Added `is_cpu_overclocked INTEGER` column (boolean as 0/1)
- Added `is_ram_overclocked INTEGER` column (boolean as 0/1)
- Implemented automatic migrations to add columns to existing databases
- Updated `insertAppUsageLog()` method to handle all new fields

#### Supabase (`server/supabase-schema.sql`)
- Added `cpu_temperature REAL` column to `app_usage_logs` table
- Added `is_cpu_overclocked BOOLEAN` column
- Added `is_ram_overclocked BOOLEAN` column
- Updated `supabase-client.js` to conditionally include all new fields in inserts

### 5. **Package Updates** (`package.json`)
- Added `systeminformation` package as a dependency
- Included `systeminformation` in Electron's `asarUnpack` configuration

## How It Works

### Data Collection Flow
1. **Client** collects hardware monitoring data every 3 seconds:
   - On Windows: Uses `WindowsHardwareMonitor` for optimized detection
   - On Linux/macOS: Falls back to `systeminformation` package
2. **Client** sends all hardware data via WebSocket to the server:
   - CPU temperature (in Celsius, or `null` if not available)
   - CPU overclocking status (boolean, or `null` if detection failed)
   - RAM overclocking status (boolean, or `null` if detection failed)
3. **Server** receives the data and stores it in the database
4. **Database** stores all fields with appropriate data types

### Code Examples

#### Windows Hardware Monitor
<augment_code_snippet path="client/windows-hardware-monitor.js" mode="EXCERPT">
````javascript
class WindowsHardwareMonitor {
  async getCpuTemperature() {
    // Try WMI, Open Hardware Monitor, LibreHardwareMonitor
    const wmiTemp = await this.getCpuTempFromWMI();
    if (wmiTemp !== null) return wmiTemp;

    const ohmTemp = await this.getCpuTempFromOHM();
    if (ohmTemp !== null) return ohmTemp;

    return null;
  }

  async getAllData() {
    const [cpuTemp, overclockData] = await Promise.all([
      this.getCpuTemperature(),
      this.checkOverclocking()
    ]);

    return {
      cpuTemperature: cpuTemp,
      isCpuOverclocked: overclockData.cpuOverclocked,
      isRamOverclocked: overclockData.ramOverclocked
    };
  }
}
````
</augment_code_snippet>

#### Client Integration
<augment_code_snippet path="client/pc-logger.js" mode="EXCERPT">
````javascript
// Get hardware monitoring data (temperature + overclocking status)
async function getHardwareData() {
  if (os.platform() === 'win32') {
    return await windowsMonitor.getAllData();
  }

  // Fallback for other platforms
  const temp = await getCpuTemperature();
  return {
    cpuTemperature: temp,
    isCpuOverclocked: null,
    isRamOverclocked: null
  };
}
````
</augment_code_snippet>

## Platform Support

### ✅ Fully Supported Features by Platform

| Feature | Windows | Linux | macOS |
|---------|---------|-------|-------|
| CPU Temperature | ⚠️ Requires drivers | ✅ Full support | ✅ Full support |
| CPU Overclocking Detection | ✅ Full support | ❌ Not implemented | ❌ Not implemented |
| RAM Overclocking Detection | ✅ Full support | ❌ Not implemented | ❌ Not implemented |

### Windows Support Details

#### CPU Temperature Monitoring
On Windows, CPU temperature monitoring requires specific hardware monitoring drivers:
- **Open Hardware Monitor** (recommended) - https://openhardwaremonitor.org/
- **LibreHardwareMonitor** - https://github.com/LibreHardwareMonitor/LibreHardwareMonitor
- **HWiNFO** with shared memory enabled

The system tries multiple detection methods in order:
1. **WMI MSAcpi_ThermalZoneTemperature** - Native Windows (works on some systems)
2. **Open Hardware Monitor WMI** - If OHM is installed and running
3. **LibreHardwareMonitor WMI** - If LHM is installed and running

Without these drivers, temperature will return `null` but will not cause errors.

#### CPU Overclocking Detection
✅ **Works out of the box on Windows!**
- Uses WMI to query `Win32_Processor` for MaxClockSpeed and CurrentClockSpeed
- CPU is considered overclocked if current speed > max speed by more than 5%
- No additional drivers required

#### RAM Overclocking Detection
✅ **Works out of the box on Windows!**
- Uses WMI to query `Win32_PhysicalMemory` for RAM speed
- Compares against standard JEDEC speeds:
  - DDR3: 1333, 1600, 1866 MHz
  - DDR4: 2133, 2400, 2666, 2933, 3200 MHz
- RAM is considered overclocked if speed > 3200 MHz and not a standard speed
- No additional drivers required

### Linux/macOS Support
- **CPU Temperature**: Full support via `systeminformation` package
  - Linux: Requires `lm-sensors` package installed
  - macOS: Works with `osx-temperature-sensor` package
- **Overclocking Detection**: Not currently implemented (returns `null`)

## Database Schema

### SQLite
```sql
CREATE TABLE app_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  memory_usage_bytes INTEGER,
  cpu_percent REAL,
  gpu_percent REAL,
  cpu_temperature REAL,           -- New field (in Celsius, or null)
  is_cpu_overclocked INTEGER,     -- New field (boolean as 0/1, or null)
  is_ram_overclocked INTEGER,     -- New field (boolean as 0/1, or null)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Supabase (PostgreSQL)
```sql
CREATE TABLE app_usage_logs (
  id SERIAL PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL,
  memory_usage_bytes BIGINT,
  cpu_percent REAL,
  gpu_percent REAL,
  cpu_temperature REAL,           -- New field (in Celsius, or null)
  is_cpu_overclocked BOOLEAN,     -- New field (true/false, or null)
  is_ram_overclocked BOOLEAN,     -- New field (true/false, or null)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_app_usage UNIQUE (pc_name, app_name, start_time)
);
```

## Migration Instructions

### For Existing SQLite Databases
The migration is **automatic**. When the server starts, it will:
1. Check if the new columns exist (`cpu_temperature`, `is_cpu_overclocked`, `is_ram_overclocked`)
2. Add any missing columns
3. Log the migration status for each column

No manual intervention required!

### For Existing Supabase Databases
Run the migration SQL in Supabase SQL Editor:

```sql
-- Add cpu_temperature column
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS cpu_temperature REAL;

-- Add is_cpu_overclocked column
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS is_cpu_overclocked BOOLEAN;

-- Add is_ram_overclocked column
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS is_ram_overclocked BOOLEAN;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'app_usage_logs'
ORDER BY ordinal_position;
```

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left menu
4. Paste the SQL above
5. Click "Run"

The migration script is also available in `migrate-supabase-cpu-temp.sql`.

## Testing

The feature has been tested and verified on Windows:
- ✅ CPU temperature collection working (with drivers)
- ✅ CPU overclocking detection working (no drivers needed)
- ✅ RAM overclocking detection working (no drivers needed)
- ✅ Data sent from client to server via WebSocket
- ✅ Data stored in SQLite database with all new fields
- ✅ Data stored in Supabase database with all new fields
- ✅ Null values handled gracefully when features unavailable
- ✅ Backward compatibility maintained
- ✅ Caching mechanism working (reduces PowerShell overhead)
- ✅ Windows-specific optimizations functional

## Usage Examples

### Viewing Hardware Monitoring Data (SQLite)
```bash
sqlite3 server/local.db "SELECT pc_name, app_name, cpu_percent, cpu_temperature, is_cpu_overclocked, is_ram_overclocked, created_at FROM app_usage_logs ORDER BY created_at DESC LIMIT 10;"
```

### Viewing Hardware Monitoring Data (Supabase)
```sql
SELECT
  pc_name,
  app_name,
  cpu_percent,
  cpu_temperature,
  is_cpu_overclocked,
  is_ram_overclocked,
  created_at
FROM app_usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Analyzing Hardware Data

#### Temperature Trends
```sql
-- Average CPU temperature by PC
SELECT
  pc_name,
  AVG(cpu_temperature) as avg_temp,
  MAX(cpu_temperature) as max_temp,
  MIN(cpu_temperature) as min_temp
FROM app_usage_logs
WHERE cpu_temperature IS NOT NULL
GROUP BY pc_name;

-- Temperature over time for a specific PC
SELECT
  DATE(created_at) as date,
  AVG(cpu_temperature) as avg_temp
FROM app_usage_logs
WHERE pc_name = 'YOUR_PC_NAME'
  AND cpu_temperature IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### Overclocking Detection
```sql
-- Find all PCs with overclocked CPUs
SELECT DISTINCT pc_name
FROM app_usage_logs
WHERE is_cpu_overclocked = true;

-- Find all PCs with overclocked RAM
SELECT DISTINCT pc_name
FROM app_usage_logs
WHERE is_ram_overclocked = true;

-- Count overclocked vs non-overclocked systems
SELECT
  CASE
    WHEN is_cpu_overclocked = true THEN 'Overclocked'
    WHEN is_cpu_overclocked = false THEN 'Stock'
    ELSE 'Unknown'
  END as cpu_status,
  COUNT(DISTINCT pc_name) as pc_count
FROM app_usage_logs
GROUP BY cpu_status;

-- Find PCs with both CPU and RAM overclocked
SELECT DISTINCT pc_name
FROM app_usage_logs
WHERE is_cpu_overclocked = true
  AND is_ram_overclocked = true;
```

## Troubleshooting

### Issue: Temperature always returns null on Windows
**Solution**: Install Open Hardware Monitor or LibreHardwareMonitor
1. Download Open Hardware Monitor from: https://openhardwaremonitor.org/
2. Run it as Administrator
3. Keep it running in the background
4. Restart the RFID client

**Alternative**: Use LibreHardwareMonitor
1. Download from: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases
2. Run as Administrator
3. Keep it running in the background
4. Restart the RFID client

### Issue: Overclocking detection returns null
**Solution**:
1. Check if PowerShell is available and not restricted
2. Verify WMI service is running: `Get-Service Winmgmt`
3. Check server logs for PowerShell errors
4. Try running this command manually:
   ```powershell
   Get-WmiObject -Class Win32_Processor | Select-Object MaxClockSpeed, CurrentClockSpeed
   ```

### Issue: Data not showing in database
**Solution**:
1. Check server logs for errors
2. Verify the migrations ran successfully (check server startup logs)
3. Check if the new columns exist in the database:
   - SQLite: `sqlite3 server/local.db ".schema app_usage_logs"`
   - Supabase: Check table structure in dashboard
4. Ensure the client is sending the data (check WebSocket messages in server logs)

### Issue: Migration failed on Supabase
**Solution**:
1. Manually run the migration SQL in Supabase SQL Editor
2. Check for permission issues (need table ALTER permission)
3. Verify you're connected to the correct database
4. Check if columns already exist (migration is idempotent)

### Issue: Performance is slow on Windows
**Solution**:
The caching mechanism should prevent this, but if you experience slowness:
1. Check if multiple PowerShell processes are running
2. Verify caching is working (check timestamps in logs)
3. Consider increasing cache timeout in `windows-hardware-monitor.js`
4. Ensure antivirus is not blocking PowerShell execution

## Future Enhancements

Potential improvements for this feature:
- [ ] Add temperature alerts/warnings for overheating (e.g., > 80°C)
- [ ] Add overclocking alerts for lab administrators
- [ ] Track temperature trends over time in dashboard
- [ ] Add dashboard visualization for all hardware monitoring data
- [ ] Support for multiple temperature sensors (per-core temperatures)
- [ ] Add GPU temperature monitoring
- [ ] Export hardware monitoring reports
- [ ] Implement overclocking detection for Linux/macOS
- [ ] Add voltage monitoring
- [ ] Add fan speed monitoring
- [ ] Historical overclocking tracking (detect when overclocking was enabled/disabled)

## API Changes

### WebSocket Message Format
```javascript
{
  type: 'app_usage_update',
  pc_name: 'PC_NAME',
  app_name: 'Application Name',
  start_time: '2025-11-01T12:00:00',
  end_time: '2025-11-01T12:01:00',
  duration_seconds: 60,
  memory_usage_bytes: 500000000,
  cpu_percent: 25.5,
  gpu_percent: 10.2,
  cpu_temperature: 65.5,        // New field (in Celsius, or null)
  is_cpu_overclocked: false,    // New field (boolean, or null)
  is_ram_overclocked: false     // New field (boolean, or null)
}
```

### Database Method Signature
```javascript
// Old signature (deprecated but still works)
db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent)

// New signature with CPU temperature only
db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent, cpuTemperature)

// Current signature with all hardware monitoring fields
db.insertAppUsageLog(
  pcName,
  appName,
  startTime,
  endTime,
  duration,
  memoryUsage,
  cpuPercent,
  gpuPercent,
  cpuTemperature,
  isCpuOverclocked,
  isRamOverclocked
)
```

## Summary

The Windows Hardware Monitoring feature is now fully integrated into the RFID Laboratory PC Monitoring System. It provides comprehensive insights into system performance, thermal management, and hardware configuration - especially valuable for laboratory environments where system stability and performance monitoring are critical.

**Key Benefits:**
- 🌡️ **Real-time temperature monitoring** - Track CPU temperatures to prevent overheating
- ⚡ **Overclocking detection** - Identify systems running beyond stock specifications
- 💾 **Historical data storage** - Analyze trends over time
- 🔍 **Early problem detection** - Identify thermal or stability issues before they cause failures
- 📊 **Lab-wide visibility** - See which PCs are overclocked or running hot
- 🎯 **Windows-optimized** - Multiple detection methods for maximum compatibility
- ⚡ **Minimal performance impact** - Efficient caching reduces overhead
- 🔄 **Backward compatible** - Works with existing installations
- 🛡️ **Graceful degradation** - Returns null when features unavailable, never crashes

**Perfect for Laboratory Environments:**
- Monitor all lab PCs from a central dashboard
- Detect unauthorized overclocking
- Identify cooling problems before hardware damage
- Track system performance over time
- Generate reports on hardware configurations
- Ensure all systems meet lab standards

