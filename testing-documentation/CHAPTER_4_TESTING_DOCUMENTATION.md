# Chapter 4: Testing and Evaluation
## Laboratory PC Monitoring and Usage Tracking System

---

## 4.1 Test Environment Setup

### 4.1.1 Hardware Configuration
- **Test Client PCs**: 5 Windows 10/11 laboratory computers
  - PC1: Intel Core i3-8109U, 8GB RAM
  - PC2: Intel Core i5-8300H, 16GB RAM  
  - PC3: AMD Ryzen 5 3600, 16GB RAM
  - PC4: Intel Core i7-9700, 32GB RAM
  - PC5: Intel Core i5-10210U, 8GB RAM

- **Server Configuration**: 
  - Windows Server 2019/Windows 10 Pro
  - Node.js v16+
  - Supabase Cloud Database (PostgreSQL)
  - Network: Local Area Network (LAN)

### 4.1.2 Software Configuration
- **Client Application**: Electron-based monitoring client v2.5.0
- **Server Application**: Node.js Express server with WebSocket support
- **Database**: Supabase PostgreSQL (Cloud-hosted)
- **Web Dashboard**: Hosted on Netlify or local web server
- **Browser**: Chrome, Edge, Firefox (latest versions)

### 4.1.3 Network Configuration
- **Protocol**: WebSocket (ws://) on port 8080
- **REST API**: HTTP on port 3000
- **Database**: Supabase cloud connection
- **Latency**: < 10ms (LAN environment)

---

## 4.2 Test Objectives

The testing phase aims to validate:
1. **Accuracy**: Data collection and recording accuracy
2. **Reliability**: System stability and connection reliability
3. **Performance**: Resource usage and response times
4. **Functionality**: All features work as designed
5. **Data Integrity**: Data consistency across components
6. **Usability**: Dashboard interface effectiveness

---

## 4.3 Test Cases

### 4.3.1 Functional Testing

#### TC-001: Client Application Startup and Connection
**Objective**: Verify client application starts correctly and connects to server

**Test Steps**:
1. Install client application on test PC
2. Configure server IP address in client config
3. Launch client application
4. Observe connection status in client UI
5. Check server logs for connection confirmation

**Expected Result**: 
- Client starts without errors
- Connection established within 5 seconds
- Server logs show client connection with PC name
- Client status shows "Connected"

**Actual Result**: ✅ PASS / ❌ FAIL

**Notes**: 
- Connection time: ____ seconds
- Error messages (if any): ___________

---

#### TC-002: System Information Collection
**Objective**: Verify system hardware information is collected and stored correctly

**Test Steps**:
1. Start client application
2. Wait 10 seconds for system info collection
3. Query database for system_info table
4. Verify collected data matches actual PC specifications
5. Check dashboard displays system information

**Expected Result**:
- CPU model, cores, speed recorded correctly
- Total memory recorded accurately (within 1GB tolerance)
- OS platform and version recorded
- Hostname matches PC name
- System info visible on web dashboard

**Data to Verify**:
| Field | Expected Value | Actual Value | Status |
|-------|---------------|--------------|--------|
| CPU Model | [Actual CPU] | | |
| CPU Cores | [Actual Cores] | | |
| Total Memory (GB) | [Actual Memory] | | |
| OS Version | [Actual OS] | | |
| Hostname | [PC Name] | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**Accuracy**: CPU Model: ___%, CPU Cores: ___%, Memory: ___%

---

#### TC-003: Application Usage Tracking - Start Event
**Objective**: Verify application start events are detected and logged

**Test Steps**:
1. Ensure client is connected to server
2. Open Microsoft Word (or any application)
3. Wait 5 seconds
4. Query database for app_usage_logs table
5. Verify entry exists with:
   - app_name = "Microsoft Word" (or actual app name)
   - start_time within 5 seconds of opening
   - cpu_percent and memory_usage_bytes recorded

**Expected Result**:
- Application detected within 3 seconds
- Start event logged in database
- CPU and memory usage captured
- Dashboard shows application session

**Actual Result**: ✅ PASS / ❌ FAIL

**Detection Time**: ____ seconds
**Latency**: ____ milliseconds

---

#### TC-004: Application Usage Tracking - End Event
**Objective**: Verify application end events are logged with accurate duration

**Test Steps**:
1. Open an application (e.g., Notepad)
2. Record exact time opened
3. Use application for 30 seconds
4. Close application
5. Record exact time closed
6. Query database for corresponding log entry
7. Verify:
   - end_time matches close time
   - duration_seconds ≈ 30 seconds (within ±3 seconds tolerance)
   - Final CPU and memory usage recorded

**Expected Result**:
- End event logged within 3 seconds of closing
- Duration calculated accurately (±3 seconds tolerance)
- Final resource metrics recorded
- Session marked as complete

**Test Data**:
| Metric | Expected | Actual | Difference | Status |
|--------|----------|--------|------------|--------|
| Duration (seconds) | 30 | | | |
| Duration Accuracy | ±3s | | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**Duration Accuracy**: ± ____ seconds

---

#### TC-005: Application Switching Detection
**Objective**: Verify system correctly handles application switching

**Test Steps**:
1. Open Application A (e.g., Chrome)
2. Wait 10 seconds
3. Switch to Application B (e.g., Word)
4. Wait 10 seconds
5. Switch back to Application A
6. Query database for log entries

**Expected Result**:
- Application A end event logged when switching to B
- Application B start event logged
- Application B end event logged when switching back
- Application A start event logged again
- Total of 4 log entries (2 starts, 2 ends)
- All durations accurate

**Actual Result**: ✅ PASS / ❌ FAIL

**Number of Entries**: Expected: 4, Actual: ___

---

#### TC-006: Browser Activity Tracking
**Objective**: Verify browser search queries are captured correctly

**Test Steps**:
1. Open Google Chrome (or Edge/Firefox)
2. Perform Google search: "nodejs tutorial"
3. Perform Bing search: "javascript async await"
4. Query database for browser_search_logs
5. Verify entries include:
   - Correct search query
   - Correct search engine identification
   - URL and timestamp

**Expected Result**:
- Google search query "nodejs tutorial" logged
- Bing search query "javascript async await" logged
- Search engine correctly identified
- URLs and timestamps accurate
- Dashboard displays browser activity

**Test Cases**:
| Search Engine | Query | Detected | Search Engine ID | Status |
|--------------|-------|----------|------------------|--------|
| Google | "nodejs tutorial" | | | |
| Bing | "javascript async await" | | | |
| YouTube | "react tutorial" | | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**Detection Rate**: ___% of search queries captured

---

#### TC-007: Session Start/Stop Tracking
**Objective**: Verify PC session start and stop events

**Test Steps**:
1. Start client application (session start)
2. Verify start event in time_logs table
3. Use PC for 5 minutes
4. Stop client application (session stop)
5. Verify stop event logged with correct duration

**Expected Result**:
- Start event logged when client starts
- is_online = true in pc_status table
- Stop event logged when client stops
- Session duration calculated correctly
- is_online = false after stop

**Actual Result**: ✅ PASS / ❌ FAIL

**Session Duration Accuracy**: ± ____ seconds

---

#### TC-008: Real-time Resource Monitoring (CPU/Memory)
**Objective**: Verify CPU and memory usage are monitored in real-time

**Test Steps**:
1. Open Task Manager on client PC
2. Note actual CPU and memory usage
3. Open web dashboard
4. Click "Show Processes" for the PC
5. Compare dashboard CPU/Memory values with Task Manager
6. Wait 10 seconds and verify updates

**Expected Result**:
- CPU percentage matches Task Manager (±5% tolerance)
- Memory usage matches Task Manager (±50MB tolerance)
- Values update every 3-5 seconds
- Charts display recent data (last 60 seconds)

**Comparison Data**:
| Metric | Task Manager | Dashboard | Difference | Status |
|--------|--------------|-----------|------------|--------|
| CPU % | | | | |
| Memory (MB) | | | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**CPU Accuracy**: ± ____%
**Memory Accuracy**: ± ____ MB
**Update Frequency**: Every ____ seconds

---

#### TC-009: Idle Status Detection
**Objective**: Verify system correctly detects PC idle status

**Test Steps**:
1. Ensure client is connected and active
2. Verify dashboard shows PC as "Active"
3. Stop all user activity (no mouse/keyboard input)
4. Wait 5 minutes without activity
5. Check dashboard for idle status
6. Move mouse or type (resume activity)
7. Verify status changes back to "Active"

**Expected Result**:
- Status changes to "Idle" after 5 minutes of inactivity
- Orange indicator or icon shown for idle status
- Status changes to "Active" immediately upon activity resumption
- Timestamp updates correctly

**Actual Result**: ✅ PASS / ❌ FAIL

**Idle Detection Time**: ____ minutes
**Status Change Latency**: ____ seconds

---

#### TC-010: Web Dashboard Data Display
**Objective**: Verify web dashboard correctly displays all collected data

**Test Steps**:
1. Open web dashboard
2. Select a PC from the list
3. Select today's date
4. Verify all sections display correctly:
   - PC Status Card (Online/Offline, Last Seen)
   - System Information
   - App Sessions count
   - Total Usage time
   - App usage table with data
   - Charts (App distribution, Search engines)
   - Browser activity table

**Expected Result**:
- All UI elements render correctly
- Data populates all sections
- Charts display properly
- Tables are sortable and paginated
- Date filter works correctly
- No console errors

**Actual Result**: ✅ PASS / ❌ FAIL

**UI Responsiveness**: ✅ / ❌
**Data Loading Time**: ____ seconds

---

### 4.3.2 Accuracy Testing

#### TC-011: Duration Calculation Accuracy
**Objective**: Measure accuracy of application usage duration calculations

**Test Steps**:
1. Open stopwatch/timer application
2. Open Application A
3. Start stopwatch simultaneously
4. Use application for exactly 60 seconds
5. Stop stopwatch and close application simultaneously
6. Query database for duration_seconds
7. Calculate difference

**Test Cases (Multiple Durations)**:
| Expected Duration | Actual Duration | Difference | Accuracy % | Status |
|-------------------|-----------------|------------|------------|--------|
| 30 seconds | | | | |
| 60 seconds | | | | |
| 120 seconds | | | | |
| 300 seconds | | | | |

**Expected Result**:
- Duration accuracy within ±3 seconds for all test cases
- Average accuracy > 95%

**Actual Result**: ✅ PASS / ❌ FAIL

**Average Accuracy**: ____%

---

#### TC-012: CPU Usage Accuracy
**Objective**: Verify CPU usage percentage accuracy

**Test Steps**:
1. Open Task Manager and note CPU usage
2. Load PC with CPU-intensive task (e.g., video encoding)
3. Monitor CPU usage in Task Manager (every 5 seconds for 1 minute)
4. Query database for corresponding app_usage_logs entries
5. Compare CPU percentages

**Test Data**:
| Time | Task Manager CPU % | Database CPU % | Difference | Status |
|------|-------------------|----------------|------------|--------|
| 0:00 | | | | |
| 0:05 | | | | |
| 0:10 | | | | |
| 0:15 | | | | |
| 0:30 | | | | |

**Expected Result**:
- CPU values match within ±5% for each measurement
- Average difference < 3%

**Actual Result**: ✅ PASS / ❌ FAIL

**Average CPU Difference**: ± ____%

---

#### TC-013: Memory Usage Accuracy
**Objective**: Verify memory usage measurement accuracy

**Test Steps**:
1. Open Task Manager and note memory usage for an application
2. Open multiple applications to vary memory usage
3. Query database for memory_usage_bytes values
4. Convert bytes to MB and compare with Task Manager

**Test Data**:
| Application | Task Manager (MB) | Database (MB) | Difference (MB) | Status |
|-------------|------------------|---------------|-----------------|--------|
| Chrome | | | | |
| Word | | | | |
| VS Code | | | | |

**Expected Result**:
- Memory values match within ±50MB for applications
- Conversion accuracy maintained

**Actual Result**: ✅ PASS / ❌ FAIL

**Average Memory Difference**: ± ____ MB

---

#### TC-014: Timestamp Accuracy
**Objective**: Verify timestamps are accurate and timezone-handled correctly

**Test Steps**:
1. Record exact system time when opening an application
2. Query database for start_time
3. Compare with recorded time
4. Check timezone conversion on web dashboard
5. Verify dates display correctly for different dates

**Test Data**:
| Action Time (Local) | Database Timestamp (UTC) | Dashboard Display | Accuracy | Status |
|---------------------|--------------------------|-------------------|----------|--------|
| | | | | |

**Expected Result**:
- Database stores timestamps in UTC (ISO format)
- Dashboard converts and displays in local timezone correctly
- Date queries return correct date's data
- No timezone offset errors

**Actual Result**: ✅ PASS / ❌ FAIL

**Timezone Conversion Accuracy**: ✅ / ❌

---

### 4.3.3 Reliability Testing

#### TC-015: Connection Reconnection
**Objective**: Verify automatic reconnection after network interruption

**Test Steps**:
1. Start client application (connected)
2. Disconnect network cable or disable network adapter
3. Wait 30 seconds
4. Reconnect network
5. Observe reconnection behavior
6. Verify data transmission resumes

**Expected Result**:
- Client detects disconnection within 10 seconds
- Reconnection attempts start immediately
- Exponential backoff: 1s, 2s, 4s... up to 30s max
- Reconnection successful within 60 seconds
- Buffered data sent after reconnection
- No data loss

**Actual Result**: ✅ PASS / ❌ FAIL

**Disconnection Detection Time**: ____ seconds
**Reconnection Time**: ____ seconds
**Data Loss**: Yes / No

---

#### TC-016: Data Buffering During Disconnection
**Objective**: Verify data is buffered when disconnected and sent after reconnection

**Test Steps**:
1. Ensure client is connected
2. Disconnect network
3. Open and use applications for 2 minutes (generate data)
4. Reconnect network
5. Query database for logged data
6. Verify all activities during disconnection are logged

**Expected Result**:
- Data buffered to data-buffer.json file
- All app usage events captured
- Data sent successfully after reconnection
- All buffered data appears in database
- No duplicate entries

**Actual Result**: ✅ PASS / ❌ FAIL

**Buffered Events**: Expected: ___, Actual: ___
**Data Recovery Rate**: ____%

---

#### TC-017: Server Restart Handling
**Objective**: Verify client behavior when server restarts

**Test Steps**:
1. Start client (connected to server)
2. Stop server application
3. Wait 30 seconds
4. Start server application
5. Observe client reconnection
6. Verify normal operation resumes

**Expected Result**:
- Client detects server disconnection
- Client attempts reconnection
- Successful reconnection after server restart
- Normal data transmission resumes
- No client crash or errors

**Actual Result**: ✅ PASS / ❌ FAIL

**Client Stability**: ✅ / ❌
**Reconnection Time**: ____ seconds

---

#### TC-018: Long-Running Session Stability
**Objective**: Verify system stability during extended operation

**Test Steps**:
1. Start client application
2. Keep PC running with active usage for 8 hours
3. Monitor:
   - Memory leaks (memory usage over time)
   - CPU usage (should remain low)
   - Connection stability
   - Data logging consistency
4. Check for crashes or errors

**Expected Result**:
- No crashes or errors for 8+ hours
- Memory usage remains stable (±100MB variation)
- CPU usage remains low (<5% average)
- Connection maintained throughout
- All data logged correctly

**Test Duration**: ____ hours

| Hour | Memory (MB) | CPU % | Connection | Errors |
|------|-------------|-------|------------|--------|
| 1 | | | | |
| 2 | | | | |
| 4 | | | | |
| 8 | | | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**Stability**: ✅ / ❌
**Memory Leak**: Yes / No

---

#### TC-019: Multiple Client Concurrent Operation
**Objective**: Verify server handles multiple clients simultaneously

**Test Steps**:
1. Connect 5 client PCs to same server
2. Use all PCs simultaneously (different applications)
3. Monitor server:
   - CPU usage
   - Memory usage
   - Database connection pool
   - WebSocket connections
4. Verify all clients' data logged correctly

**Expected Result**:
- All 5 clients connected successfully
- Server handles all connections without errors
- All data from all clients logged correctly
- No data corruption or mixing
- Server CPU/Memory within acceptable limits (<50% CPU, <2GB RAM)

**Test Data**:
| Client | Connected | Data Logged | Errors | Status |
|--------|-----------|-------------|--------|--------|
| PC1 | | | | |
| PC2 | | | | |
| PC3 | | | | |
| PC4 | | | | |
| PC5 | | | | |

**Actual Result**: ✅ PASS / ❌ FAIL

**Server Resource Usage**: CPU: ____%, Memory: ____ MB

---

### 4.3.4 Performance Testing

#### TC-020: Data Transmission Latency
**Objective**: Measure latency between data collection and database storage

**Test Steps**:
1. Record timestamp when opening an application
2. Query database immediately after
3. Calculate time difference (T1: open time, T2: database timestamp)
4. Repeat 10 times for different applications
5. Calculate average latency

**Test Results**:
| Test # | Action Time | DB Timestamp | Latency (ms) |
|--------|-------------|--------------|--------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| Average | | | |

**Expected Result**:
- Average latency < 500ms
- 95% of events logged within 1 second
- Maximum latency < 2 seconds

**Actual Result**: ✅ PASS / ❌ FAIL

**Average Latency**: ____ ms
**95th Percentile**: ____ ms

---

#### TC-021: Dashboard Load Performance
**Objective**: Measure dashboard page load and data retrieval time

**Test Steps**:
1. Open browser developer tools (Network tab)
2. Open dashboard URL
3. Measure:
   - Initial page load time
   - Data fetch time (Supabase queries)
   - Chart rendering time
   - Total time to interactive
4. Repeat with 100 app usage entries, 1000 entries

**Test Results**:
| Metric | 100 Entries | 1000 Entries | Target |
|--------|-------------|--------------|--------|
| Page Load (ms) | | | < 2000 |
| Data Fetch (ms) | | | < 1500 |
| Chart Render (ms) | | | < 1000 |
| Total Time (ms) | | | < 5000 |

**Expected Result**:
- Page loads in < 2 seconds
- Data fetched in < 1.5 seconds (1000 entries)
- Charts render in < 1 second
- Acceptable performance up to 10,000 entries

**Actual Result**: ✅ PASS / ❌ FAIL

---

#### TC-022: Database Query Performance
**Objective**: Measure database query response times

**Test Steps**:
1. Populate database with test data (1000+ app usage entries)
2. Execute common queries:
   - Get all PC statuses
   - Get app usage for date range
   - Get browser activity for PC
   - Get system info
3. Measure query execution time

**Test Results**:
| Query Type | Rows Returned | Execution Time (ms) | Target |
|------------|---------------|---------------------|--------|
| PC Status | | | < 500 |
| App Usage (1 day) | | | < 1000 |
| Browser Activity | | | < 800 |
| System Info | | | < 300 |

**Expected Result**:
- All queries complete in < 1 second
- Performance scales linearly with data volume
- No timeout errors

**Actual Result**: ✅ PASS / ❌ FAIL

---

### 4.3.5 Data Integrity Testing

#### TC-023: Data Consistency Across Components
**Objective**: Verify data consistency between client, server, and database

**Test Steps**:
1. Perform specific actions on client (open Word, use for 60s, close)
2. Check server logs for received messages
3. Query database for stored records
4. Compare all three:
   - Application name
   - Start/end times
   - Duration
   - CPU/Memory values

**Test Data**:
| Component | App Name | Start Time | End Time | Duration | Match |
|-----------|----------|------------|----------|----------|-------|
| Client Sent | | | | | |
| Server Received | | | | | |
| Database Stored | | | | | |

**Expected Result**:
- Data matches across all three components
- No data loss or corruption
- Timestamps consistent (UTC conversion handled)

**Actual Result**: ✅ PASS / ❌ FAIL

---

#### TC-024: Duplicate Entry Prevention
**Objective**: Verify system prevents duplicate log entries

**Test Steps**:
1. Send same app_usage_start message twice (simulate reconnection)
2. Check database for duplicate entries
3. Verify upsert mechanism prevents duplicates

**Expected Result**:
- No duplicate entries created
- Upsert/conflict resolution works correctly
- Each unique session logged once

**Actual Result**: ✅ PASS / ❌ FAIL

---

#### TC-025: Date/Time Zone Consistency
**Objective**: Verify date/time handling across different timezones

**Test Steps**:
1. Set client PC to UTC+8 (Philippine Time)
2. Record action at specific local time (e.g., 2:00 PM PST)
3. Query database (should show UTC time)
4. View on dashboard (should convert back to local time)
5. Verify correct date displayed

**Test Data**:
| Action | Client Time (Local) | Database (UTC) | Dashboard (Local) | Correct |
|--------|---------------------|----------------|-------------------|---------|
| | | | | |

**Expected Result**:
- Database stores UTC correctly
- Dashboard displays local time correctly
- Date queries return correct day's data
- No date shifting (11/12 data shows on 11/12, not 11/11)

**Actual Result**: ✅ PASS / ❌ FAIL

---

### 4.3.6 Integration Testing

#### TC-026: End-to-End Data Flow
**Objective**: Verify complete data flow from client to dashboard

**Test Steps**:
1. Start client application on PC1
2. Open Chrome browser
3. Search for "testing query" on Google
4. Use Chrome for 2 minutes
5. Open Word, type document for 3 minutes
6. Close both applications
7. Open web dashboard
8. Select PC1 and today's date
9. Verify:
   - Browser activity shows Google search "testing query"
   - App usage shows Chrome session (2 minutes)
   - App usage shows Word session (3 minutes)
   - Total usage shows 5 minutes
   - Charts display correctly

**Expected Result**:
- All activities visible on dashboard
- Data accurate and complete
- All sections populated correctly

**Actual Result**: ✅ PASS / ❌ FAIL

---

#### TC-027: Real-time Dashboard Updates
**Objective**: Verify dashboard updates in real-time

**Test Steps**:
1. Open dashboard for a connected PC
2. Open an application on that PC
3. Refresh dashboard (or wait for auto-refresh)
4. Verify new data appears
5. Close application
6. Verify end event appears

**Expected Result**:
- Dashboard shows new data within 5 seconds
- Auto-refresh works (if enabled)
- Real-time metrics update

**Actual Result**: ✅ PASS / ❌ FAIL

**Update Latency**: ____ seconds

---

## 4.4 Test Results Summary

### 4.4.1 Overall Test Statistics

| Category | Total Tests | Passed | Failed | Pass Rate |
|----------|-------------|--------|--------|-----------|
| Functional Testing | 10 | | | ___% |
| Accuracy Testing | 4 | | | ___% |
| Reliability Testing | 5 | | | ___% |
| Performance Testing | 3 | | | ___% |
| Data Integrity Testing | 3 | | | ___% |
| Integration Testing | 2 | | | ___% |
| **TOTAL** | **27** | | | **___%** |

### 4.4.2 Key Metrics Achieved

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Duration Accuracy | ±3 seconds | ±____ seconds | ✅/❌ |
| CPU Measurement Accuracy | ±5% | ±____% | ✅/❌ |
| Memory Measurement Accuracy | ±50MB | ±____MB | ✅/❌ |
| Data Transmission Latency | <500ms | ____ms | ✅/❌ |
| Connection Reliability | >99% | ____% | ✅/❌ |
| System Uptime (8 hours) | No crashes | ____ hours | ✅/❌ |
| Dashboard Load Time | <2s | ____s | ✅/❌ |

### 4.4.3 Issues Found and Resolved

1. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Resolution**: [How it was fixed]
   - **Status**: ✅ Resolved / ❌ Pending

2. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Resolution**: [How it was fixed]
   - **Status**: ✅ Resolved / ❌ Pending

---

## 4.5 System Accuracy Analysis

### 4.5.1 Duration Calculation Accuracy

**Analysis**: 
The system's duration calculation was tested across multiple time intervals. The results show:

- **Average Accuracy**: ___%
- **Standard Deviation**: ±____ seconds
- **Accuracy Range**: ±____ seconds to ±____ seconds

**Conclusion**: [System meets/exceeds accuracy requirements]

### 4.5.2 Resource Usage Measurement Accuracy

**CPU Measurement**:
- Average difference from Task Manager: ±____%
- Correlation coefficient: 0.____

**Memory Measurement**:
- Average difference from Task Manager: ±____MB
- Conversion accuracy: ___%

### 4.5.3 Data Collection Completeness

**Data Collection Rate**: ____%
- Application usage events: ____% captured
- Browser activities: ____% captured
- System resource metrics: ____% captured

---

## 4.6 Performance Analysis

### 4.6.1 Response Times

| Operation | Average (ms) | P95 (ms) | P99 (ms) |
|-----------|--------------|----------|----------|
| Data Transmission | | | |
| Database Query | | | |
| Dashboard Load | | | |
| Real-time Update | | | |

### 4.6.2 System Resource Usage

**Client Application**:
- CPU Usage: ____% (average), ____% (peak)
- Memory Usage: ____MB (average), ____MB (peak)

**Server Application**:
- CPU Usage: ____% (average), ____% (peak)
- Memory Usage: ____MB (average), ____MB (peak)

**Database**:
- Query Response Time: ____ms (average)
- Connection Pool Usage: ____/____

---

## 4.7 Reliability Analysis

### 4.7.1 Connection Stability

- **Uptime**: ____ hours tested without crashes
- **Reconnection Success Rate**: ____%
- **Average Reconnection Time**: ____ seconds
- **Data Loss During Disconnection**: ____%

### 4.7.2 Error Handling

- **Total Errors Encountered**: ____
- **Handled Gracefully**: ____
- **System Crashes**: ____
- **Recovery Time**: ____ seconds (average)

---

## 4.8 Conclusion

### 4.8.1 System Validation

The Laboratory PC Monitoring and Usage Tracking System has been thoroughly tested across 27 test cases covering functional requirements, accuracy, reliability, performance, and integration. The system demonstrates:

✅ **High Accuracy**: Duration calculations within ±3 seconds, resource measurements within acceptable tolerances

✅ **Reliable Operation**: Stable operation for extended periods, automatic reconnection, data buffering

✅ **Good Performance**: Low latency data transmission, fast dashboard loading, efficient database queries

✅ **Data Integrity**: Consistent data across all components, proper timezone handling, no data loss

### 4.8.2 Recommendations

1. [Any recommendations for improvements]
2. [Optimization suggestions]
3. [Future enhancements]

### 4.8.3 Final Verdict

**Overall Test Result**: ✅ PASS / ❌ FAIL

The system meets/exceeds the specified requirements and is suitable for deployment in a laboratory environment for PC usage monitoring and tracking.

---

## Appendix A: Test Data Samples

[Include sample database queries, screenshots, log outputs, etc.]

## Appendix B: Test Environment Screenshots

[Include screenshots of test setup, dashboard, database records, etc.]

## Appendix C: Error Logs

[Include any error logs encountered during testing]

---

**Document Version**: 1.0  
**Last Updated**: [Date]  
**Prepared By**: [Your Name]  
**Reviewed By**: [Reviewer Name]

