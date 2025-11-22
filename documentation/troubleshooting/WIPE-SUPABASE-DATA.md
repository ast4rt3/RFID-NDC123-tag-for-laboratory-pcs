# Wipe Supabase Data Guide

## ⚠️ WARNING
**This will DELETE ALL DATA from your Supabase database!**  
This action **CANNOT BE UNDONE**. Make sure you have backups if needed.

---

## Method 1: Using SQL (Recommended)

### Option A: Safe Version (Check First)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `wipe-supabase-data-safe.sql`
3. Run the query to see current data counts
4. Review the counts
5. If you're sure, uncomment the DELETE statements and run again

### Option B: Direct Wipe

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `wipe-supabase-data.sql`
3. Click **Run** or press `Ctrl+Enter`

**SQL Code:**
```sql
-- Delete all data from all tables
DELETE FROM time_logs;
DELETE FROM app_usage_logs;
DELETE FROM browser_search_logs;
DELETE FROM system_info;

-- Reset auto-increment IDs
ALTER SEQUENCE time_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE app_usage_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE browser_search_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE system_info_id_seq RESTART WITH 1;
```

---

## Method 2: Using Node.js Script

### Prerequisites
- Node.js installed
- `.env` file configured with Supabase credentials

### Steps

1. Make sure your `.env` file has:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   ```

2. Run the script:
   ```bash
   node reset-supabase.js
   ```

3. The script will:
   - Delete all data from all tables
   - Verify table structure
   - Show confirmation messages

---

## What Gets Deleted

| Table | Description |
|-------|-------------|
| `time_logs` | PC session time logs |
| `app_usage_logs` | Application usage logs with resource metrics |
| `browser_search_logs` | Browser search history logs |
| `system_info` | System information for each PC |

---

## Verify Data is Wiped

After running the wipe, verify all tables are empty:

```sql
SELECT 'time_logs' as table_name, COUNT(*) as row_count FROM time_logs
UNION ALL
SELECT 'app_usage_logs', COUNT(*) FROM app_usage_logs
UNION ALL
SELECT 'browser_search_logs', COUNT(*) FROM browser_search_logs
UNION ALL
SELECT 'system_info', COUNT(*) FROM system_info;
```

All counts should be **0**.

---

## Backup Before Wiping (Optional)

If you want to keep a backup before wiping:

### Using Supabase Dashboard

1. Go to Database → Backups
2. Create a manual backup
3. Wait for backup to complete
4. Then proceed with wiping

### Using SQL Export

```sql
-- Export time_logs
COPY time_logs TO '/tmp/time_logs_backup.csv' CSV HEADER;

-- Export app_usage_logs
COPY app_usage_logs TO '/tmp/app_usage_logs_backup.csv' CSV HEADER;

-- Export browser_search_logs
COPY browser_search_logs TO '/tmp/browser_search_logs_backup.csv' CSV HEADER;

-- Export system_info
COPY system_info TO '/tmp/system_info_backup.csv' CSV HEADER;
```

---

## Troubleshooting

### Permission Denied

If you get a permission error, make sure you're using the **service_role** key, not the **anon** key.

In your `.env` file:
```env
SUPABASE_KEY=your_service_role_key  # Not the anon key!
```

### Table Not Found

If you get "table not found" errors, it means that table doesn't exist in your database. This is normal - just ignore those errors.

### Cannot Delete Due to Foreign Keys

If you have foreign key constraints, you might need to delete in a specific order or temporarily disable constraints:

```sql
-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Delete data
DELETE FROM time_logs;
DELETE FROM app_usage_logs;
DELETE FROM browser_search_logs;
DELETE FROM system_info;

-- Re-enable triggers
SET session_replication_role = 'origin';
```

---

## After Wiping

After wiping the data:

1. **Restart the server** to clear any cached data:
   ```bash
   node server/server.js
   ```

2. **Restart client applications** to start fresh sessions

3. **Verify new data is being logged** by checking the server console for:
   ```
   💻 PC connected
   ▶ Started session for [PC_NAME]
   📊 Received system info from [PC_NAME]
   ```

---

## Files Created

- ✅ `wipe-supabase-data.sql` - Direct wipe SQL script
- ✅ `wipe-supabase-data-safe.sql` - Safe version with confirmation
- ✅ `reset-supabase.js` - Updated Node.js script
- ✅ `WIPE-SUPABASE-DATA.md` - This guide

---

## Quick Reference

**Check data counts:**
```bash
node -e "require('./reset-supabase.js')"
```

**Wipe all data (SQL):**
```sql
DELETE FROM time_logs;
DELETE FROM app_usage_logs;
DELETE FROM browser_search_logs;
DELETE FROM system_info;
```

**Wipe all data (Node.js):**
```bash
node reset-supabase.js
```