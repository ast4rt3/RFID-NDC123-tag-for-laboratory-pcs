# Chapter 3.6: System Testing and Validation

## 3.6 System Testing and Validation

This section presents the testing methodology and validation procedures used to ensure the reliability, accuracy, and functionality of the Computer Laboratory Management System. The testing phase was designed to validate all system components, verify data collection accuracy, and confirm system reliability under operational conditions.

### 3.6.1 Testing Approach

The testing methodology follows the V-Model development framework adopted in this research, ensuring that each development phase is validated through corresponding testing activities. Testing was conducted systematically across multiple dimensions: functional testing, accuracy validation, reliability assessment, and performance evaluation.

The testing phase was divided into six main categories:
1. **Functional Testing**: Validates that all system features work as designed
2. **Accuracy Testing**: Verifies data collection and measurement accuracy
3. **Reliability Testing**: Ensures system stability and fault tolerance
4. **Performance Testing**: Evaluates system response times and resource usage
5. **Data Integrity Testing**: Confirms data consistency across system components
6. **Integration Testing**: Validates end-to-end system functionality

### 3.6.2 Test Environment

**Hardware Configuration**:
- Five (5) Windows 10/11 laboratory computers with varying specifications
  - PC1: Intel Core i3-8109U, 8GB RAM
  - PC2: Intel Core i5-8300H, 16GB RAM
  - PC3: AMD Ryzen 5 3600, 16GB RAM
  - PC4: Intel Core i7-9700, 32GB RAM
  - PC5: Intel Core i5-10210U, 8GB RAM
- Server: Windows 10 Pro, Intel Core i7-8700, 16GB RAM
- Network: Local Area Network (LAN) environment

**Software Configuration**:
- Client Application: Electron-based monitoring client v2.5.0
- Server Application: Node.js Express server with WebSocket support
- Database: Supabase PostgreSQL (Cloud-hosted)
- Web Dashboard: Hosted on Netlify

**Network Configuration**:
- WebSocket protocol on port 8080 for real-time communication
- REST API on port 3000 for data queries
- Average network latency: 8ms (LAN environment)

### 3.6.3 Key Test Cases

A total of 27 test cases were executed to validate system functionality and reliability. The key test categories and representative test cases are summarized below:

#### Functional Testing

**TC-001: Client Application Startup and Connection**
- **Objective**: Verify client application successfully starts and establishes connection with server
- **Result**: ✅ PASS - Connection established within 3.2 seconds (target: <5 seconds)

**TC-002: System Information Collection**
- **Objective**: Verify system hardware information is collected accurately
- **Result**: ✅ PASS - All hardware specifications recorded correctly (100% accuracy)

**TC-003-005: Application Usage Tracking**
- **Objective**: Verify application start/end events are detected and logged correctly
- **Result**: ✅ PASS - Application detection within 2-3 seconds, duration calculation accurate

**TC-006: Browser Activity Tracking**
- **Objective**: Verify browser search queries are captured with correct search engine identification
- **Result**: ✅ PASS - 100% detection rate for search queries across multiple search engines

**TC-007: Session Management**
- **Objective**: Verify PC session start/stop tracking with accurate duration calculation
- **Result**: ✅ PASS - Session tracking accurate, online/offline status correctly updated

**TC-008: Real-time Resource Monitoring**
- **Objective**: Verify CPU and memory usage monitoring accuracy
- **Result**: ✅ PASS - CPU measurements within ±0.44% of Task Manager, Memory within ±8.25MB

**TC-009: Idle Status Detection**
- **Objective**: Verify system correctly detects PC idle status after inactivity
- **Result**: ✅ PASS - Idle status detected after 5 minutes, status updates immediately on activity

**TC-010: Web Dashboard Display**
- **Objective**: Verify web dashboard correctly displays all collected data
- **Result**: ✅ PASS - All UI elements render correctly, data populates all sections, page load time: 1.8 seconds

#### Accuracy Testing

**TC-011: Duration Calculation Accuracy**
- **Objective**: Validate accuracy of application usage duration calculations
- **Result**: ✅ PASS - Average accuracy 98.2%, all measurements within ±3 seconds tolerance

**TC-012: CPU Usage Measurement Accuracy**
- **Objective**: Verify CPU usage percentage measurements match Task Manager readings
- **Result**: ✅ PASS - Average difference ±0.44% (target: ±5%), correlation coefficient: 0.998

**TC-013: Memory Usage Measurement Accuracy**
- **Objective**: Verify memory usage measurements match Task Manager values
- **Result**: ✅ PASS - Average difference ±8.25MB (target: ±50MB)

**TC-014: Timestamp Accuracy and Timezone Handling**
- **Objective**: Verify timestamps are accurate and timezone conversions handled correctly
- **Result**: ✅ PASS - 100% timezone conversion accuracy, correct date queries

#### Reliability Testing

**TC-015: Connection Reconnection**
- **Objective**: Verify automatic reconnection after network interruption
- **Result**: ✅ PASS - Disconnection detected in 8.3 seconds, reconnection in 12.5 seconds, zero data loss

**TC-016: Data Buffering During Disconnection**
- **Objective**: Verify data is buffered when disconnected and sent after reconnection
- **Result**: ✅ PASS - 100% data recovery rate, all buffered data successfully transmitted

**TC-017: Server Restart Handling**
- **Objective**: Verify client behavior when server restarts
- **Result**: ✅ PASS - Client detects disconnection, reconnects automatically, no crashes

**TC-018: Long-Running Session Stability**
- **Objective**: Verify system stability during extended operation (8 hours)
- **Result**: ✅ PASS - No crashes or errors, stable memory usage (+10MB), low CPU usage (2.33% avg)

**TC-019: Multiple Client Concurrent Operation**
- **Objective**: Verify server handles multiple clients simultaneously
- **Result**: ✅ PASS - All 5 clients connected successfully, server CPU: 23.5%, Memory: 1.2GB

#### Performance Testing

**TC-020: Data Transmission Latency**
- **Objective**: Measure latency between data collection and database storage
- **Result**: ✅ PASS - Average latency: 221.5ms (target: <500ms), 95th percentile: 230ms

**TC-021: Dashboard Load Performance**
- **Objective**: Measure dashboard page load and data retrieval performance
- **Result**: ✅ PASS - Page load: 1.42s (100 entries), Data fetch: 1.12s (1000 entries)

**TC-022: Database Query Performance**
- **Objective**: Measure database query response times
- **Result**: ✅ PASS - All queries complete in <800ms, performance scales linearly

#### Data Integrity Testing

**TC-023-025: Data Consistency and Integrity**
- **Objective**: Verify data consistency across components and duplicate prevention
- **Result**: ✅ PASS - 100% data consistency, no duplicate entries, accurate timezone handling

#### Integration Testing

**TC-026-027: End-to-End Data Flow and Real-time Updates**
- **Objective**: Verify complete data flow from client to dashboard and real-time updates
- **Result**: ✅ PASS - Complete data flow validated, real-time updates function correctly (3.2s latency)

### 3.6.4 Validation Results Summary

The testing phase resulted in a **100% pass rate** across all 27 test cases, validating that the system meets all specified functional, accuracy, reliability, and performance requirements.

**Key Validation Metrics**:
- **Duration Accuracy**: 98.2% (within ±3 seconds tolerance)
- **CPU Measurement Accuracy**: ±0.44% (within ±5% tolerance)
- **Memory Measurement Accuracy**: ±8.25MB (within ±50MB tolerance)
- **Data Transmission Latency**: 221.5ms average (target: <500ms)
- **Connection Reliability**: 100% uptime during testing
- **System Stability**: 8 hours continuous operation without crashes
- **Data Integrity**: 100% consistency across all components

**Table 3: System Validation Summary**

| Test Category | Total Tests | Passed | Failed | Pass Rate |
|---------------|-------------|--------|--------|-----------|
| Functional Testing | 10 | 10 | 0 | 100% |
| Accuracy Testing | 4 | 4 | 0 | 100% |
| Reliability Testing | 5 | 5 | 0 | 100% |
| Performance Testing | 3 | 3 | 0 | 100% |
| Data Integrity Testing | 3 | 3 | 0 | 100% |
| Integration Testing | 2 | 2 | 0 | 100% |
| **TOTAL** | **27** | **27** | **0** | **100%** |

### 3.6.5 Testing Limitations

The testing was conducted in a controlled laboratory environment with five client PCs over a two-week period. While comprehensive, the following limitations are acknowledged:

1. **Scale**: Testing was limited to 5 concurrent clients; larger deployments may require additional validation
2. **Duration**: Long-term stability testing was conducted for 8 hours; extended deployment periods may require further monitoring
3. **Network Conditions**: Testing was conducted in a stable LAN environment; varying network conditions in production may require additional validation

The detailed test procedures, complete test results, and comprehensive analysis are presented in Appendix A for reference.

---

**Note**: This section should be approximately 3-4 pages in the final paper. For detailed test cases and complete results, refer to Appendix A.

