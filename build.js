import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const MAX_ASSET_SIZE_BYTES = 25 * 1024 * 1024; // 25 MiB Cloudflare Workers limit

console.log('================================================================================');
console.log('🏗️  LIGHTHOUSE SCHOOL VISIT — PRODUCTION ASSET BUILD & AUDIT');
console.log('================================================================================');

// 1. Clean and initialize dist/
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'static'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'data'), { recursive: true });

// 2. Copy root index.html
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(DIST_DIR, 'index.html'));

// 3. Copy static folder
const staticFiles = fs.readdirSync(path.join(__dirname, 'static'));
for (const file of staticFiles) {
  fs.copyFileSync(path.join(__dirname, 'static', file), path.join(DIST_DIR, 'static', file));
}

// 4. Copy data folder
const dataFiles = fs.readdirSync(path.join(__dirname, 'data'));
for (const file of dataFiles) {
  fs.copyFileSync(path.join(__dirname, 'data', file), path.join(DIST_DIR, 'data', file));
}

// 5. Generate Cloudflare security headers (dist/_headers)
const headersContent = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self)

/static/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/data/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
`;
fs.writeFileSync(path.join(DIST_DIR, '_headers'), headersContent);

// 6. Generate .assetsignore in dist/ and root to prevent any _worker.js inclusion
const assetsIgnoreContent = `_worker.js
node_modules/
.wrangler/
*.ts
*.map
.DS_Store
`;
fs.writeFileSync(path.join(DIST_DIR, '.assetsignore'), assetsIgnoreContent);
fs.writeFileSync(path.join(__dirname, '.assetsignore'), assetsIgnoreContent);
fs.writeFileSync(path.join(__dirname, '.cfignore'), assetsIgnoreContent);

// 7. Ensure NO _redirects or _worker.js exists in dist/ (prevents infinite loop & worker conflicts)
if (fs.existsSync(path.join(DIST_DIR, '_redirects'))) {
  fs.unlinkSync(path.join(DIST_DIR, '_redirects'));
  console.log('Removed conflicting _redirects from dist/');
}
if (fs.existsSync(path.join(DIST_DIR, '_worker.js'))) {
  fs.unlinkSync(path.join(DIST_DIR, '_worker.js'));
  console.log('Removed conflicting _worker.js from dist/');
}

// 8. DATA COUNT AUDIT & INTEGRITY CHECK
console.log('\n📊 DATASET VERIFICATION & AUDIT:');
console.log('--------------------------------------------------------------------------------');

// Load JSON
const jsonRaw = fs.readFileSync(path.join(DIST_DIR, 'data', 'schools.json'), 'utf8');
const schoolsJson = JSON.parse(jsonRaw);
const jsonCount = schoolsJson.length;

// Load Embedded HTML
const htmlRaw = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
const matchEmb = htmlRaw.match(/window\.GADCHIROLI_SCHOOLS\s*=\s*(\[.*?\]);/s);
let embeddedCount = 0;
if (matchEmb) {
  try {
    const parsed = JSON.parse(matchEmb[1]);
    embeddedCount = parsed.length;
  } catch(e) {
    console.error('Failed to parse embedded dataset in index.html', e);
  }
}

// Load CSV
const csvRaw = fs.readFileSync(path.join(DIST_DIR, 'data', 'GADCHIROLI_all_schools.csv'), 'utf8');
const csvLines = csvRaw.trim().split('\n').filter(l => l.trim().length > 0);
const csvCount = csvLines.length - 1; // subtract header

console.log(`JSON Records Count         : ${jsonCount}`);
console.log(`Embedded HTML Count        : ${embeddedCount}`);
console.log(`Master CSV Records Count   : ${csvCount}`);

if (jsonCount !== 1968 || embeddedCount !== 1968 || csvCount !== 1968) {
  console.error('❌ CRITICAL ERROR: Dataset count mismatch! Expected 1,968 records across all layers.');
  process.exit(1);
}
console.log('✅ PASS: All layers exactly match 1,968 verified school records (Zero Data Loss).');

// 9. AUDIT ASSET SIZES AGAINST 25 MiB CLOUDFLARE LIMIT
console.log('\n🔍 AUDITING ALL PRODUCTION ASSETS IN dist/ AGAINST 25 MiB LIMIT:');
console.log('--------------------------------------------------------------------------------');
console.log(String('File Path').padEnd(45) + String('Size (Bytes)').padEnd(16) + String('Size (MiB)').padEnd(14) + 'Status');
console.log('--------------------------------------------------------------------------------');

function auditDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      auditDir(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      const relPath = path.relative(DIST_DIR, fullPath);
      const sizeBytes = stats.size;
      const sizeMiB = sizeBytes / (1024 * 1024);
      const isOk = sizeBytes <= MAX_ASSET_SIZE_BYTES;
      console.log(
        relPath.padEnd(45) +
        sizeBytes.toLocaleString().padEnd(16) +
        `${sizeMiB.toFixed(3)} MiB`.padEnd(14) +
        (isOk ? '✅ PASS' : '❌ EXCEEDS 25 MiB')
      );
      if (!isOk) {
        console.error(`❌ Asset ${relPath} exceeds 25 MiB!`);
        process.exit(1);
      }
    }
  }
}

auditDir(DIST_DIR);
console.log('--------------------------------------------------------------------------------');
console.log('🎉 BUILD SUCCESSFUL! All production assets strictly verified below 25 MiB.');
console.log('Cloudflare Workers & Pages static assets ready for deployment from ./dist\n');
