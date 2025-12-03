const Database = require('./server/database');
require('dotenv').config();

const db = new Database();

const logs = [
    {
        pc_name: 'i3S',
        browser: 'Chrome',
        search_query: 'Introduction to Node.js',
        url: 'https://www.youtube.com/results?search_query=Introduction+to+Node.js',
        search_engine: 'YouTube',
        timestamp: '2025-11-27 09:15:22'
    },
    {
        pc_name: 'i3S',
        browser: 'Chrome',
        search_query: 'Stack Overflow - JS Error',
        url: 'https://stackoverflow.com/questions/123456/js-error',
        search_engine: 'Google',
        timestamp: '2025-11-27 09:18:45'
    },
    {
        pc_name: 'i3S',
        browser: 'Brave',
        search_query: 'NBSC Student Information System',
        url: 'https://nbsc.edu.ph/sis/index.php',
        search_engine: 'Direct',
        timestamp: '2025-11-27 10:05:11'
    },
    {
        pc_name: 'i3S',
        browser: 'Edge',
        search_query: 'IEEE Xplore: IoT Research',
        url: 'https://ieeexplore.ieee.org/search/searchresult.jsp?newsearch=true&queryText=IoT%20Research',
        search_engine: 'Bing',
        timestamp: '2025-11-27 10:45:33'
    }
];

async function insertLogs() {
    console.log('Waiting for database connection...');
    // Give it a moment to initialize Supabase connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Inserting logs...');
    for (const log of logs) {
        try {
            await db.insertBrowserSearchLog(
                log.pc_name,
                log.browser,
                log.url,
                log.search_query,
                log.search_engine,
                new Date(log.timestamp)
            );
            console.log(`✅ Inserted: ${log.search_query} at ${log.timestamp}`);
        } catch (err) {
            console.error(`❌ Failed to insert ${log.search_query}:`, err.message);
        }
    }
    console.log('Done.');
    process.exit(0);
}

insertLogs();
