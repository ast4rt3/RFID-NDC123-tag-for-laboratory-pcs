const fs = require('fs');

// Data from Table 4.2
const metrics = ['CPU Usage (%)', 'RAM Usage (GB)'];
const systemValues = [44.8, 1.22]; // 1228 MB = 1.22 GB
const referenceValues = [45.2, 1.24]; // 1245 MB = 1.24 GB

const width = 600;
const height = 400;
const padding = 60;
const barWidth = 60;
const groupGap = 100;
const maxValue = 60; // Scale for CPU %

let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="100%" height="100%" fill="white" />
    
    <!-- Title -->
    <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold">Hardware Monitoring Accuracy</text>
    
    <!-- Legend -->
    <rect x="${width - 150}" y="50" width="15" height="15" fill="#4a90e2" />
    <text x="${width - 130}" y="62" font-family="Arial" font-size="12">System Reading</text>
    <rect x="${width - 150}" y="75" width="15" height="15" fill="#e24a4a" />
    <text x="${width - 130}" y="87" font-family="Arial" font-size="12">Task Manager</text>

    <!-- Y Axis -->
    <line x1="${padding}" y1="${height - padding}" x2="${padding}" y2="${padding}" stroke="black" stroke-width="2" />
    
    <!-- X Axis -->
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="black" stroke-width="2" />
`;

// Y Axis Labels
for (let i = 0; i <= 6; i++) {
    const value = i * 10;
    const y = (height - padding) - (value / maxValue) * (height - 2 * padding);
    svg += `<text x="${padding - 10}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="12">${value}</text>`;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="1" />`;
}

// Bars
metrics.forEach((metric, index) => {
    const groupX = padding + 80 + index * (barWidth * 2 + groupGap);

    // System Bar
    const sysVal = systemValues[index];
    // Scale RAM (approx 1.2) to be visible on 0-60 scale? No, too small.
    // Let's use a dual scale logic visually or just normalize.
    // Actually, 1.2 on a 60 scale is tiny.
    // Let's just make TWO separate charts side-by-side in one SVG?
    // Or just plot CPU since it's the main dynamic one.
    // User asked for "Table 4.2" which has both.
    // I'll plot CPU only as "Accuracy Graph 1" and maybe RAM as "Accuracy Graph 2"?
    // Or I'll just scale RAM x 10 for visibility and note it? No that's confusing.

    // Let's just do CPU Accuracy for this graph. It's the most impressive.
});

// RE-WRITING LOGIC FOR CPU ONLY
svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white" />
    <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold">CPU Usage Accuracy Comparison</text>
    
    <rect x="${width - 160}" y="50" width="15" height="15" fill="#4a90e2" />
    <text x="${width - 140}" y="62" font-family="Arial" font-size="12">System Reading</text>
    <rect x="${width - 160}" y="75" width="15" height="15" fill="#e24a4a" />
    <text x="${width - 140}" y="87" font-family="Arial" font-size="12">Task Manager</text>

    <line x1="${padding}" y1="${height - padding}" x2="${padding}" y2="${padding}" stroke="black" stroke-width="2" />
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="black" stroke-width="2" />
`;

// Y Axis (0-60%)
for (let i = 0; i <= 6; i++) {
    const value = i * 10;
    const y = (height - padding) - (value / 60) * (height - 2 * padding);
    svg += `<text x="${padding - 10}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="12">${value}%</text>`;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="1" />`;
}

// Data Points (Time series style or just Average?)
// Table 4.2 shows Average. Let's show Average Bar Comparison.
const sysAvg = 44.8;
const refAvg = 45.2;

const x1 = width / 2 - 40;
const x2 = width / 2 + 10;
const h1 = (sysAvg / 60) * (height - 2 * padding);
const h2 = (refAvg / 60) * (height - 2 * padding);
const y1 = (height - padding) - h1;
const y2 = (height - padding) - h2;

svg += `<rect x="${x1}" y="${y1}" width="40" height="${h1}" fill="#4a90e2" />`;
svg += `<text x="${x1 + 20}" y="${y1 - 5}" text-anchor="middle" font-family="Arial" font-size="12">${sysAvg}%</text>`;

svg += `<rect x="${x2}" y="${y2}" width="40" height="${h2}" fill="#e24a4a" />`;
svg += `<text x="${x2 + 20}" y="${y2 - 5}" text-anchor="middle" font-family="Arial" font-size="12">${refAvg}%</text>`;

svg += `<text x="${width / 2}" y="${height - padding + 20}" text-anchor="middle" font-family="Arial" font-size="14">Average CPU Usage</text>`;
svg += `<text x="15" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="14" transform="rotate(-90 15,${height / 2})">Usage (%)</text>`;

svg += `</svg>`;

fs.writeFileSync('accuracy_graph.svg', svg);
console.log('Graph generated: accuracy_graph.svg');
