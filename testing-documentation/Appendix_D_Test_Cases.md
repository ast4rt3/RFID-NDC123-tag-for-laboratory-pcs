# APPENDIX D: COMPREHENSIVE TEST CASE DOCUMENTATION

## D.1 Testing Overview

### D.1.1 Testing Objectives

The testing phase for the RFID-Integrated Laboratory PC Monitoring System was designed to validate the following objectives:

1. **Functional Correctness**: Verify that all system features work as designed and meet the specified requirements.
2. **Accuracy Validation**: Ensure that data collection, measurement, and logging mechanisms achieve acceptable accuracy levels.
3. **Reliability Assurance**: Confirm system stability, fault tolerance, and error recovery capabilities under various operational scenarios.
4. **Performance Evaluation**: Validate system response times, resource utilization, and scalability under realistic workloads.

### D.1.2 Testing Scope

The testing covered all major system components:

- **Client Application**: Electron-based monitoring client running on laboratory PCs
- **Server Application**: Node.js WebSocket server handling real-time data streams
- **Database Layer**: Supabase PostgreSQL database for persistent storage
- **Web Dashboard**: Netlify-hosted dashboard for data visualization
- **RFID Integration**: NFC tag scanning for quick PC status access
- **Hardware Monitoring**: LibreHardwareMonitor integration for CPU temperature, voltage, and power tracking

---

## D.2 Test Environment Configuration

### D.2.1 Hardware Configuration

The testing environment consisted of five laboratory computers and one server machine:

**Laboratory Client PCs:**
- **ICSLAB2-PC08**: Intel Core i3-8109U, 24GB RAM, Windows 11 Pro
- **ICSLAB2-PC09**: Intel Core i5-8300H, 16GB RAM, Windows 10 Pro
- **ICSLAB2-PC10**: AMD Ryzen 5 3600, 16GB RAM, Windows 11 Pro
- **ICSLAB2-PC11**: Intel Core i7-9700, 32GB RAM, Windows 10 Pro
- **ICSLAB2-PC12**: Intel Core i5-10210U, 8GB RAM, Windows 11 Home

**Server:**
- **Processor**: Intel Core i7-8700 (6 cores, 12 threads)
- **Memory**: 16GB DDR4
- **Operating System**: Windows 10 Pro
- **Network**: Gigabit Ethernet (LAN)

**RFID Hardware:**
- **Reader**: USB NFC Reader (HID Mode, 13.56 MHz)
- **Tags**: NTAG215 NFC Tags (25 units, mapped to PC identifiers)

### D.2.2 Software Configuration

**Client Application:**
- **Platform**: Electron v25.3.0
- **Runtime**: Node.js v18.16.0
- **Key Dependencies**: 
  - `active-win` v8.1.0 (window tracking)
  - `node-hid` v2.1.2 (RFID reader integration)
  - `systeminformation` v5.21.8 (hardware info)
  - LibreHardwareMonitor v0.9.2 (thermal/voltage monitoring)

**Server Application:**
- **Platform**: Node.js v18.16.0
- **Framework**: Express v4.18.2
- **WebSocket**: ws v8.13.0
- **Database Client**: @supabase/supabase-js v2.26.0

**Database:**
- **Provider**: Supabase (PostgreSQL 15)
- **Hosting**: Cloud-hosted (supabase.co)
- **Schema**: 9 tables (pc_info, time_logs, app_usage_logs, browser_search_logs, temperature_logs, voltage_logs, power_logs, disk_logs, rfid_scans)

**Web Dashboard:**
- **Hosting**: Netlify CDN
- **Technology**: Vanilla HTML/CSS/JavaScript
- **Charting**: Chart.js v4.3.0

### D.2.3 Network Configuration

- **Topology**: Local Area Network (LAN)
- **Protocol**: WebSocket (ws://) on port 8080 for real-time data streaming
- **REST API**: HTTP on port 3000 for dashboard queries
- **Average Latency**: ~8ms (measured between client and server)
- **Bandwidth**: Gigabit Ethernet (1 Gbps theoretical, ~940 Mbps actual)

### D.2.4 Testing Tools

- **Windows Task Manager**: For CPU, RAM, and GPU usage verification
- **Stopwatch**: For duration accuracy measurements
- **Network Simulator**: For connection interruption testing
- **Database Query Console**: For data integrity verification
- **Browser DevTools**: For dashboard performance profiling

---

## D.3 Testing Methodology

### D.3.1 Test Categories

The testing was organized into four primary categories:

1. **Functional Testing (TC-001 to TC-010)**: Validates core system features including client startup, data collection, browser tracking, idle detection, and RFID dashboard access.

2. **Accuracy Testing (TC-011 to TC-014)**: Measures precision of time tracking, CPU/RAM monitoring, and timestamp handling against ground truth references.

3. **Reliability Testing (TC-015 to TC-019)**: Assesses system resilience through network reconnection tests, data buffering validation, server stress tests, and long-duration stability tests.

4. **Performance Testing (TC-020 to TC-027)**: Evaluates system response times, resource footprint, and sensor polling rates to ensure acceptable performance levels.

### D.3.2 Test Execution Process

Each test case was executed following a standardized procedure:

1. **Test Preparation**: Configure test environment, reset database state, ensure stable network conditions
2. **Test Execution**: Execute test steps according to documented procedure
3. **Data Collection**: Record actual results, capture screenshots, log timestamps
4. **Result Verification**: Compare actual results against expected outcomes
5. **Status Determination**: Mark test as PASS if within tolerance, FAIL otherwise

### D.3.3 Acceptance Criteria

**Pass Criteria:**
- **Functional Tests**: Feature works as designed without errors
- **Accuracy Tests**: Measurements within specified tolerance (e.g., ±3s for duration, ±5% for CPU)
- **Reliability Tests**: System recovers from failures without data loss
- **Performance Tests**: Response times meet target thresholds

**Fail Criteria:**
- Feature does not work or produces errors
- Measurements exceed tolerance limits
- Data loss or corruption occurs
- Response times exceed acceptable thresholds

---

## D.4 Detailed Test Cases

The following table presents all 27 test cases executed during the validation phase:

| ID | Category | Test Case Name | Objective | Expected Outcome | Actual Result | Status |
|----|----------|----------------|-----------|------------------|---------------|--------|
| TC-001 | Functional | Client Startup | Verify client starts automatically with Windows. | Client launches silently to system tray on boot. | Launched in 3.2s. Tray icon visible. | PASS |
| TC-002 | Functional | System Info Retrieval | Confirm retrieval of static hardware specs. | Correct CPU model, RAM size, and OS version detected. | Detected: i3-8109U, 24GB RAM, Win11. | PASS |
| TC-003 | Functional | App Usage Tracking | Verify detection of active window focus changes. | System logs new app title when user switches windows. | "Word" → "Chrome" switch logged instantly. | PASS |
| TC-004 | Functional | App Duration Logging | Verify calculation of time spent in an app. | App usage duration matches wall-clock time. | Usage logged: 5m 12s (Actual: 5m 12s). | PASS |
| TC-005 | Functional | Browser Detection | Confirm system identifies supported browsers. | Chrome, Edge, and Brave are recognized as browsers. | All 3 browsers correctly identified. | PASS |
| TC-006 | Functional | Search Query Capture | Verify capture of search terms from URL bar. | Search query text is extracted and logged. | Query "nodejs tutorial" captured. | PASS |
| TC-007 | Functional | URL Logging | Verify capture of full URL for video/article tracking. | Full URL (e.g., youtube.com/watch?v=...) is logged. | Full YouTube URL captured correctly. | PASS |
| TC-008 | Functional | Private Mode Handling | Verify behavior in Incognito/Private windows. | System captures title/URL OR respects privacy (as configured). | Captured active window title "Incognito". | PASS |
| TC-009 | Functional | Idle Status Detection | Verify status change after inactivity threshold. | Status updates to "Idle" after 5 minutes of no input. | Status changed to "Idle" at 5m 01s. | PASS |
| TC-010 | Functional | RFID Dashboard Access | Verify scanning tag opens correct mobile dashboard. | Mobile browser opens specific PC's status page. | Scanned Tag 08 → Opened ICSLAB2-PC08 Dashboard. | PASS |
| TC-011 | Accuracy | Session Duration Accuracy | Validate session timer against stopwatch. | Recorded duration within ±3 seconds of stopwatch. | Diff: +1s (31s vs 30s). | PASS |
| TC-012 | Accuracy | CPU Usage Accuracy | Compare logged CPU % with Task Manager. | Deviation < ±5%. | Diff: 0.4% (44.8% vs 45.2%). | PASS |
| TC-013 | Accuracy | RAM Usage Accuracy | Compare logged RAM with Task Manager. | Deviation < ±50 MB. | Diff: 17 MB (1228 vs 1245). | PASS |
| TC-014 | Accuracy | Timestamp Integrity | Verify UTC to Local Time conversion. | Logged time matches local wall clock (UTC+8). | Exact match (09:19 AM). | PASS |
| TC-015 | Reliability | Network Reconnection | Test recovery after internet loss. | Client auto-reconnects when network returns. | Reconnected in <5s after network restore. | PASS |
| TC-016 | Reliability | Data Buffering | Verify data is saved locally during outage. | Logs created during offline mode are synced later. | 15 offline logs synced upon reconnection. | PASS |
| TC-017 | Reliability | Server Stress Test | Test server response with multiple concurrent connections. | Server handles 5+ simultaneous client streams. | 5 PCs connected; no latency spike. | PASS |
| TC-018 | Reliability | 8-Hour Stability Test | Ensure no crashes during full workday. | No "Not Responding" errors or crashes. | System ran for 8h 05m without issue. | PASS |
| TC-019 | Reliability | Memory Leak Check | Monitor RAM usage over 8 hours. | RAM usage increase < 15%. | Increase: ~10MB (8%). Stable. | PASS |
| TC-020 | Performance | Data Latency | Measure time from client event to DB commit. | Average latency < 1 second. | Average: 221.5 ms. | PASS |
| TC-021 | Performance | Dashboard Load Time | Measure mobile dashboard loading speed. | Page loads in < 2 seconds on 4G/WiFi. | Average Load: 1.8s. | PASS |
| TC-022 | Performance | Client CPU Footprint | Measure background CPU usage of client. | Average CPU usage < 5%. | Average: 2.1%. | PASS |
| TC-023 | Performance | Client RAM Footprint | Measure background RAM usage of client. | RAM usage < 200 MB. | Average: 125 MB. | PASS |
| TC-024 | Performance | RFID Scan Response | Measure time from scan to browser open. | Browser opens in < 3 seconds. | Response: ~2.5s. | PASS |
| TC-025 | Performance | Database Query Speed | Measure time to fetch "Recent Apps" list. | Query returns in < 500ms. | Average: 350ms. | PASS |
| TC-026 | Performance | Thermal Sensor Polling | Verify update rate of temperature sensor. | Temp updates every 5-10 seconds. | Updates received every 5s. | PASS |
| TC-027 | Performance | Voltage Sensor Polling | Verify update rate of voltage sensor. | Voltage updates every 5-10 seconds. | Updates received every 5s. | PASS |

---

## D.5 Test Results Summary

### D.5.1 Overall Test Statistics

**Table D-1: Test Category Summary**

| Category | Total Tests | Passed | Failed | Pass Rate |
|----------|-------------|--------|--------|-----------|
| Functional Testing | 10 | 10 | 0 | 100% |
| Accuracy Testing | 4 | 4 | 0 | 100% |
| Reliability Testing | 5 | 5 | 0 | 100% |
| Performance Testing | 8 | 8 | 0 | 100% |
| **TOTAL** | **27** | **27** | **0** | **100%** |

### D.5.2 Key Validation Metrics

**Accuracy Metrics:**
- **Session Duration Accuracy**: ±1 second (Target: ±3 seconds) ✅
- **CPU Usage Accuracy**: ±0.4% (Target: ±5%) ✅
- **RAM Usage Accuracy**: ±17 MB (Target: ±50 MB) ✅
- **Timestamp Integrity**: 100% exact matches ✅

**Performance Metrics:**
- **Data Transmission Latency**: 221.5 ms average (Target: <1000 ms) ✅
- **Dashboard Load Time**: 1.8s average (Target: <2 seconds) ✅
- **Client CPU Footprint**: 2.1% average (Target: <5%) ✅
- **Client RAM Footprint**: 125 MB average (Target: <200 MB) ✅
- **Database Query Speed**: 350 ms average (Target: <500 ms) ✅
- **RFID Scan Response**: 2.5s average (Target: <3 seconds) ✅

**Reliability Metrics:**
- **Network Reconnection**: <5 seconds (Target: <60 seconds) ✅
- **Data Recovery Rate**: 100% (15/15 logs synced) ✅
- **System Uptime**: 8 hours 5 minutes without crashes ✅
- **Memory Stability**: 8% increase over 8 hours (Target: <15%) ✅

### D.5.3 Critical Findings

1. **All functional features operational**: 100% of core features (app tracking, browser logging, RFID scanning, idle detection) work as designed.

2. **High accuracy achieved**: Measurements consistently within or exceeding tolerance levels:
   - Time tracking: 96.7% accuracy (±1s vs ±3s target)
   - CPU monitoring: 92% more accurate than required (±0.4% vs ±5% tolerance)
   - RAM monitoring: 66% more accurate than required (±17MB vs ±50MB tolerance)

3. **Excellent performance characteristics**: All performance metrics well below target thresholds:
   - Data latency 4.5x faster than required (221.5ms vs 1000ms target)
   - Dashboard loads 10% faster than target (1.8s vs 2s)
   - Client resource usage minimal (2.1% CPU, 125MB RAM)

4. **Robust reliability**: System demonstrates excellent fault tolerance:
   - Network interruption recovery: 12x faster than required (<5s vs <60s target)
   - Zero data loss during offline periods
   - No crashes or errors during extended 8-hour operation

---

## D.6 Testing Limitations and Constraints

While the testing phase was comprehensive, the following limitations are acknowledged:

1. **Scale Limitation**: Testing conducted with 5 concurrent clients. Production deployments with 20+ clients may require additional stress testing.

2. **Duration Constraint**: Long-term stability testing limited to 8 hours. Extended deployments spanning weeks or months may reveal additional edge cases.

3. **Network Conditions**: Testing performed in stable LAN environment with ~8ms latency. Real-world conditions with WiFi interference, network congestion, or high-latency connections may impact performance.

4. **Hardware Diversity**: Testing conducted on Intel and AMD processors. Compatibility with other CPU architectures (e.g., ARM-based systems) not validated.

5. **Browser Coverage**: Search query capture tested with Chrome, Edge, and Brave. Other browsers (Firefox, Opera, Safari) not validated.

6. **Operating System**: Testing limited to Windows 10 and Windows 11. Cross-platform compatibility (Linux, macOS) not addressed.

---

## D.7 Conclusion

The comprehensive testing phase successfully validated all 27 test cases with a **100% pass rate**, demonstrating that the RFID-Integrated Laboratory PC Monitoring System meets all specified functional, accuracy, reliability, and performance requirements.

**Key Achievements:**
- ✅ All core features operational and stable
- ✅ Data accuracy exceeds requirements across all metrics
- ✅ Performance well within acceptable thresholds
- ✅ System demonstrates robust fault tolerance and recovery
- ✅ Zero data loss or corruption detected
- ✅ Minimal resource footprint suitable for background operation

**Readiness Assessment:**

The system is deemed **production-ready** for deployment in laboratory environments with the following considerations:

1. **Recommended Deployment Scale**: Up to 15 concurrent clients per server instance
2. **Network Requirements**: Stable LAN or WiFi with <50ms latency
3. **Monitoring Recommendations**: Deploy with uptime monitoring for first 2 weeks of production use
4. **Fallback Plan**: Maintain local SQLite database option for degraded-mode operation during cloud outages

The testing results provide strong evidence of system quality and readiness for real-world deployment in educational laboratory settings.

---

**Document Version**: 1.0  
**Last Updated**: December 2, 2025  
**Testing Period**: November 15 - November 30, 2025  
**Test Environment**: ICSLAB2, Computer Engineering Laboratory
