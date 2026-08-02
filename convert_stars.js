// Конвертирует выгрузку VizieR (stars.csv, Gaia DR3) в src/data/stars.json
// Запуск: node convert_stars.js
const fs = require('fs');

const csv = fs.readFileSync('stars.csv', 'utf8');
const lines = csv.split('\n');

const stars = [];
let dataStarted = false;

for (const line of lines) {
    if (line.trim().startsWith('RA_ICRS')) continue;
    if (line.trim().startsWith('---')) {
        dataStarted = true;
        continue;
    }
    if (!dataStarted) continue;
    if (!line.trim()) continue;

    // Колонки: RA_ICRS (deg), DE_ICRS (deg), Gmag (mag), Source
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;

    stars.push({
        ra: parseFloat(parts[0]),
        dec: parseFloat(parts[1]),
        magnitude: parseFloat(parts[2]),
    });
}

console.log(`Parsed ${stars.length} stars.`);
fs.writeFileSync('src/data/stars.json', JSON.stringify(stars));
