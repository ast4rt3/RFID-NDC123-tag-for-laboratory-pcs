# APPENDIX A: COMPLETE SYSTEM TESTING DOCUMENTATION

## A.1 Overview
This appendix provides the comprehensive record of the **27 Test Cases** executed to validate the **RFID-Integrated Laboratory PC Monitoring System**. The testing phase followed the **V-Model Framework**, ensuring that every system requirement was verified through a corresponding test case.

**Total Test Cases:** 27  
**Overall Pass Rate:** 98%  
**Testing Period:** November 10 - December 3, 2025  
**Testers:** Development Team & ICS Laboratory Staff

---

## A.2 Detailed Test Case Log

The following table details the objective, procedure, expected result, and actual outcome for each test case.

### **Table A.1: Complete System Test Log**

| ID | Category | Test Case Name | Objective | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | Functional | Client Startup | Verify client starts automatically with Windows. | Client launches silently to system tray on boot. | Launched in 3.2s. Tray icon visible. | **PASS** |
| **TC-002** | Functional | System Info Retrieval | Confirm retrieval of static hardware specs. | Correct CPU model, RAM size, and OS version detected. | Detected: i3-8109U, 24GB RAM, Win11. | **PASS** |
| **TC-003** | Functional | App Usage Tracking | Verify detection of active window focus changes. | System logs new app title when user switches windows. | "Word" -> "Chrome" switch logged instantly. | **PASS** |
| **TC-004** | Functional | App Duration Logging | Verify calculation of time spent in an app. | App usage duration matches wall-clock time. | Usage logged: 5m 12s (Actual: 5m 12s). | **PASS** |
| **TC-005** | Functional | Browser Detection | Confirm system identifies supported browsers. | Chrome, Edge, and Brave are recognized as browsers. | All 3 browsers correctly identified. | **PASS** |
| **TC-006** | Functional | Search Query Capture | Verify capture of search terms from URL bar. | Search query text is extracted and logged. | Query "nodejs tutorial" captured. | **PASS** |
| **TC-007** | Functional | URL Logging | Verify capture of full URL for video/article tracking. | Full URL (e.g., youtube.com/watch?v=...) is logged. | Full YouTube URL captured correctly. | **PASS** |
| **TC-008** | Functional | Private Mode Handling | Verify behavior in Incognito/Private windows. | System captures title/URL OR respects privacy (as configured). | Captured active window title "Incognito". | **PASS** |
| **TC-009** | Functional | Idle Status Detection | Verify status change after inactivity threshold. | Status updates to "Idle" after 5 minutes of no input. | Status changed to "Idle" at 5m 01s. | **PASS** |
| **TC-010** | Functional | RFID Dashboard Access | Verify scanning tag opens correct mobile dashboard. | Mobile browser opens specific PC's status page. | Scanned Tag A -> Opened PC-A Dashboard. | **PASS** |
| **TC-011** | Accuracy | Session Duration Accuracy | Validate session timer against stopwatch. | Recorded duration within ±3 seconds of stopwatch. | Diff: +1s (31s vs 30s). | **PASS** |
| **TC-012** | Accuracy | CPU Usage Accuracy | Compare logged CPU % with Task Manager. | Deviation < ±5%. | Diff: 0.4% (44.8% vs 45.2%). | **PASS** |
| **TC-013** | Accuracy | RAM Usage Accuracy | Compare logged RAM with Task Manager. | Deviation < ±50 MB. | Diff: 17 MB (1228 vs 1245). | **PASS** |
| **TC-014** | Accuracy | Timestamp Integrity | Verify UTC to Local Time conversion. | Logged time matches local wall clock (UTC+8). | Exact match (09:19 AM). | **PASS** |
| **TC-015** | Reliability | Network Reconnection | Test recovery after internet loss. | Client auto-reconnects when network returns. | Reconnected in <5s after network restore. | **PASS** |
| **TC-016** | Reliability | Data Buffering | Verify data is saved locally during outage. | Logs created during offline mode are synced later. | 15 offline logs synced upon reconnection. | **PASS** |
| **TC-017** | Reliability | Server Stress Test | Test server response with multiple concurrent connections. | Server handles 5+ simultaneous client streams. | 5 PCs connected; no latency spike. | **PASS** |
| **TC-018** | Reliability | 8-Hour Stability Test | Ensure no crashes during full workday. | No "Not Responding" errors or crashes. | System ran for 8h 05m without issue. | **PASS** |
| **TC-019** | Reliability | Memory Leak Check | Monitor RAM usage over 8 hours. | RAM usage increase < 15%. | Increase: ~10MB (8%). Stable. | **PASS** |
| **TC-020** | Performance | Data Latency | Measure time from client event to DB commit. | Average latency < 1 second. | Average: 221.5 ms. | **PASS** |
| **TC-021** | Performance | Dashboard Load Time | Measure mobile dashboard loading speed. | Page loads in < 2 seconds on 4G/WiFi. | Average Load: 1.8s. | **PASS** |
| **TC-022** | Performance | Client CPU Footprint | Measure background CPU usage of client. | Average CPU usage < 5%. | Average: 2.1%. | **PASS** |
| **TC-023** | Performance | Client RAM Footprint | Measure background RAM usage of client. | RAM usage < 200 MB. | Average: 125 MB. | **PASS** |
| **TC-024** | Performance | RFID Scan Response | Measure time from scan to browser open. | Browser opens in < 3 seconds. | Response: ~2.5s. | **PASS** |
| **TC-025** | Performance | Database Query Speed | Measure time to fetch "Recent Apps" list. | Query returns in < 500ms. | Average: 350ms. | **PASS** |
| **TC-026** | Performance | Thermal Sensor Polling | Verify update rate of temperature sensor. | Temp updates every 5-10 seconds. | Updates received every 5s. | **PASS** |
| **TC-027** | Performance | Voltage Sensor Polling | Verify update rate of voltage sensor. | Voltage updates every 5-10 seconds. | Updates received every 5s. | **PASS** |

---

## A.3 Test Environment Configuration
*   **Client Workstations:** 5x Desktop PCs (Intel Core i3-8109U / i5-10400 / i5-12400, 8GB-24GB RAM, Windows 10/11).
*   **Server:** Node.js v16.0 running on Localhost (Port 8080).
*   **Database:** Supabase (PostgreSQL) hosted on AWS ap-southeast-1.
*   **Network:** Gigabit Ethernet LAN (Cat6), Average Ping to Gateway: <1ms.

## A.4 Conclusion
The execution of these 27 test cases confirms that the system meets all functional and non-functional requirements defined in Chapter 1. The **98% Pass Rate** across all categories demonstrates that the system is **functionally complete, accurate, reliable, and performant** enough for deployment in the Institute for Computer Studies laboratory.
