const fs = require('fs');

// Realistic data based on user description (3-10 seconds)
const data = [3.2, 4.5, 3.8, 5.1, 9.2, 4.0, 3.5, 6.7, 8.1, 3.9];
const width = 800;
const height = 500;
const padding = 60;
const barWidth = 40;
const gap = 20;
const maxValue = 12; // Max 12 seconds for scale

let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="100%" height="100%" fill="white" />
    
    <!-- Title -->
    <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold">End-to-End Data Transmission Latency (Seconds)</text>
    
    <!-- Y Axis -->
    <line x1="${padding}" y1="${height - padding}" x2="${padding}" y2="${padding}" stroke="black" stroke-width="2" />
    
    <!-- X Axis -->
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="black" stroke-width="2" />
`;

// Y Axis Labels and Grid lines
for (let i = 0; i <= 6; i++) {
    const value = i * 2;
    const y = (height - padding) - (value / maxValue) * (height - 2 * padding);
    svg += `<text x="${padding - 10}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="12">${value}s</text>`;
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="1" />`;
}

// Bars
data.forEach((value, index) => {
    const x = padding + gap + index * (barWidth + gap);
    const barHeight = (value / maxValue) * (height - 2 * padding);
    const y = (height - padding) - barHeight;

    // Bar
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#4a90e2" />`;

    // Value Label
    svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-family="Arial" font-size="12">${value}s</text>`;

    // X Axis Label
    svg += `<text x="${x + barWidth / 2}" y="${height - padding + 20}" text-anchor="middle" font-family="Arial" font-size="12">T${index + 1}</text>`;
});

// X Axis Title
svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial" font-size="14">Test Iteration</text>`;

// Y Axis Title
svg += `<text x="15" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="14" transform="rotate(-90 15,${height / 2})">Latency (Seconds)</text>`;

svg += `</svg>`;

fs.writeFileSync('latency_graph.svg', svg);
console.log('Graph generated: latency_graph.svg');
