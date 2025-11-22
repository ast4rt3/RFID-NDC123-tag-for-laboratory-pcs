# Quick Testing Checklist
## Laboratory PC Monitoring System - Chapter 4

### Pre-Testing Setup
- [ ] 5 test client PCs ready (Windows 10/11)
- [ ] Server application installed and running
- [ ] Database (Supabase) configured and accessible
- [ ] Web dashboard accessible
- [ ] Network connectivity verified
- [ ] Test stopwatch/timer ready
- [ ] Task Manager open for resource comparison

---

### Functional Testing (10 Tests)

#### TC-001: Client Connection
- [ ] Client starts without errorsh
- [ ] Connection established within 5 seconds
- [ ] Server logs show client connection
- [ ] Client status shows "Connected"
- **Result**: ✅ PASS / ❌ FAIL

#### TC-002: System Information Collection
- [ ] CPU model recorded correctly
- [ ] CPU cores recorded correctly  
- [ ] Memory recorded within ±1GB
- [ ] OS version recorded correctly
- [ ] Hostname matches PC name
- **Result**: ✅ PASS / ❌ FAIL

#### TC-003: Application Start Event
- [ ] Application detected within 3 seconds
- [ ] Start event logged in database
- [ ] CPU and memory captured
- **Result**: ✅ PASS / ❌ FAIL

#### TC-004: Application End Event
- [ ] End event logged within 3 seconds
- [ ] Duration accurate (±3 seconds)
- [ ] Final resource metrics recorded
- **Result**: ✅ PASS / ❌ FAIL

#### TC-005: Application Switching
- [ ] End event logged when switching apps
- [ ] Start event logged for new app
- [ ] All events logged correctly
- **Result**: ✅ PASS / ❌ FAIL

#### TC-006: Browser Activity Tracking
- [ ] Google search query captured
- [ ] Bing search query captured
- [ ] Search engine identified correctly
- [ ] URLs and timestamps accurate
- **Result**: ✅ PASS / ❌ FAIL

#### TC-007: Session Start/Stop
- [ ] Start event logged on client start
- [ ] is_online = true in database
- [ ] Stop event logged on client stop
- [ ] Duration calculated correctly
- **Result**: ✅ PASS / ❌ FAIL

#### TC-008: Real-time Resource Monitoring
- [ ] CPU % matches Task Manager (±5%)
- [ ] Memory matches Task Manager (±50MB)
- [ ] Values update every 3-5 seconds
- [ ] Charts display recent data
- **Result**: ✅ PASS / ❌ FAIL

#### TC-009: Idle Status Detection
- [ ] Status changes to "Idle" after 5 minutes
- [ ] Orange indicator shown for idle
- [ ] Status changes to "Active" on activity
- **Result**: ✅ PASS / ❌ FAIL

#### TC-010: Web Dashboard Display
- [ ] All UI elements render correctly
- [ ] Data populates all sections
- [ ] Charts display properly
- [ ] Tables are sortable
- [ ] Date filter works
- **Result**: ✅ PASS / ❌ FAIL

---

### Accuracy Testing (4 Tests)

#### TC-011: Duration Accuracy
- [ ] Test 30 seconds: Accuracy ±3s
- [ ] Test 60 seconds: Accuracy ±3s
- [ ] Test 120 seconds: Accuracy ±3s
- [ ] Test 300 seconds: Accuracy ±3s
- **Average Accuracy**: ___%

#### TC-012: CPU Usage Accuracy
- [ ] CPU values match Task Manager (±5%)
- [ ] Average difference < 3%
- **Average Difference**: ±____%

#### TC-013: Memory Usage Accuracy
- [ ] Memory values match Task Manager (±50MB)
- **Average Difference**: ±____MB

#### TC-014: Timestamp Accuracy
- [ ] Database stores UTC correctly
- [ ] Dashboard displays local time correctly
- [ ] Date queries return correct data
- **Result**: ✅ PASS / ❌ FAIL

---

### Reliability Testing (5 Tests)

#### TC-015: Connection Reconnection
- [ ] Client detects disconnection within 10s
- [ ] Reconnection attempts start
- [ ] Reconnection successful within 60s
- [ ] No data loss
- **Result**: ✅ PASS / ❌ FAIL

#### TC-016: Data Buffering
- [ ] Data buffered during disconnection
- [ ] Buffered data sent after reconnection
- [ ] All data appears in database
- [ ] No duplicates
- **Result**: ✅ PASS / ❌ FAIL

#### TC-017: Server Restart Handling
- [ ] Client detects server disconnection
- [ ] Client reconnects after server restart
- [ ] Normal operation resumes
- [ ] No crashes
- **Result**: ✅ PASS / ❌ FAIL

#### TC-018: Long-Running Session (8 hours)
- [ ] No crashes or errors
- [ ] Memory usage stable (±100MB)
- [ ] CPU usage low (<5%)
- [ ] Connection maintained
- **Result**: ✅ PASS / ❌ FAIL

#### TC-019: Multiple Concurrent Clients (5 PCs)
- [ ] All 5 clients connected
- [ ] Server handles all connections
- [ ] All data logged correctly
- [ ] No data corruption
- **Server CPU**: ____%, **Memory**: ____MB

---

### Performance Testing (3 Tests)

#### TC-020: Data Transmission Latency
- [ ] Average latency < 500ms
- [ ] 95% within 1 second
- **Average Latency**: ____ms

#### TC-021: Dashboard Load Performance
- [ ] Page loads < 2 seconds
- [ ] Data fetch < 1.5 seconds
- [ ] Charts render < 1 second
- **Total Time**: ____ms

#### TC-022: Database Query Performance
- [ ] PC Status query < 500ms
- [ ] App Usage query < 1000ms
- [ ] Browser Activity query < 800ms
- **All queries < 1 second**: ✅ / ❌

---

### Data Integrity Testing (3 Tests)

#### TC-023: Data Consistency
- [ ] Client data = Server data = Database data
- [ ] No data loss or corruption
- [ ] Timestamps consistent
- **Result**: ✅ PASS / ❌ FAIL

#### TC-024: Duplicate Prevention
- [ ] No duplicate entries created
- [ ] Upsert mechanism works
- **Result**: ✅ PASS / ❌ FAIL

#### TC-025: Timezone Consistency
- [ ] Database stores UTC correctly
- [ ] Dashboard displays local time correctly
- [ ] Date queries return correct day
- **Result**: ✅ PASS / ❌ FAIL

---

### Integration Testing (2 Tests)

#### TC-026: End-to-End Data Flow
- [ ] Client → Server → Database → Dashboard
- [ ] All activities visible on dashboard
- [ ] Data accurate and complete
- **Result**: ✅ PASS / ❌ FAIL

#### TC-027: Real-time Dashboard Updates
- [ ] New data appears within 5 seconds
- [ ] Auto-refresh works
- [ ] Real-time metrics update
- **Result**: ✅ PASS / ❌ FAIL

---

## Quick Test Summary

| Category | Tests | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Functional | 10 | | | ___% |
| Accuracy | 4 | | | ___% |
| Reliability | 5 | | | ___% |
| Performance | 3 | | | ___% |
| Data Integrity | 3 | | | ___% |
| Integration | 2 | | | ___% |
| **TOTAL** | **27** | | | **___%** |

---

## Notes

**Test Date**: __________  
**Tested By**: __________  
**Environment**: __________  
**Issues Found**: __________  
**Overall Result**: ✅ PASS / ❌ FAIL

