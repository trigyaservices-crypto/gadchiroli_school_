import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const MAX_ASSET_SIZE_BYTES = 25 * 1024 * 1024; // 25 MiB Cloudflare Workers limit

console.log('================================================================================');
console.log('🏗️  LIGHTHOUSE SCHOOL VISIT — RESILIENT ASSET BUILD & AUDIT');
console.log('================================================================================');

// 1. Clean and initialize dist/
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'static'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'data'), { recursive: true });

// 2. Read and copy root index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ CRITICAL ERROR: index.html not found in repository root!');
  process.exit(1);
}
const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlContent);
console.log('✅ Copied root index.html to dist/index.html');

// 3. Resilient Static Assets Handling (Handles missing static/ directory gracefully)
const srcStaticDir = path.join(__dirname, 'static');
if (fs.existsSync(srcStaticDir)) {
  console.log('📁 Found local static/ directory — copying assets...');
  const staticFiles = fs.readdirSync(srcStaticDir);
  for (const file of staticFiles) {
    fs.copyFileSync(path.join(srcStaticDir, file), path.join(DIST_DIR, 'static', file));
  }
} else {
  console.log('⚠️  Notice: Local static/ directory not present in repo. Extracting modular assets from index.html...');
  // Extract CSS
  const matchStyle = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  if (matchStyle) {
    fs.writeFileSync(path.join(DIST_DIR, 'static', 'styles.css'), matchStyle[1].trim());
    console.log('  -> Generated dist/static/styles.css');
  }
  // Extract JS Data
  const matchSchoolsData = htmlContent.match(/window\.GADCHIROLI_SCHOOLS\s*=\s*(\[[\s\S]*?\]);/);
  if (matchSchoolsData) {
    const dataJsContent = `window.GADCHIROLI_SCHOOLS = ${matchSchoolsData[1]};\nwindow.SCHOOLS = window.GADCHIROLI_SCHOOLS;\n`;
    fs.writeFileSync(path.join(DIST_DIR, 'static', 'schools_data.js'), dataJsContent);
    console.log('  -> Generated dist/static/schools_data.js');
  }
}

// 4. Resilient Data Assets Handling (Handles missing data/ directory gracefully)
const srcDataDir = path.join(__dirname, 'data');
if (fs.existsSync(srcDataDir)) {
  console.log('📁 Found local data/ directory — copying dataset files...');
  const dataFiles = fs.readdirSync(srcDataDir);
  for (const file of dataFiles) {
    fs.copyFileSync(path.join(srcDataDir, file), path.join(DIST_DIR, 'data', file));
  }
} else {
  console.log('⚠️  Notice: Local data/ directory not present in repo. Extracting JSON and CSV from index.html...');
  const matchSchools = htmlContent.match(/window\.GADCHIROLI_SCHOOLS\s*=\s*(\[[\s\S]*?\]);/);
  if (matchSchools) {
    try {
      const schoolsArr = JSON.parse(matchSchools[1]);
      fs.writeFileSync(path.join(DIST_DIR, 'data', 'schools.json'), JSON.stringify(schoolsArr, null, 2));
      console.log(`  -> Generated dist/data/schools.json (${schoolsArr.length} records)`);

      // Generate master CSV
      if (schoolsArr.length > 0) {
        const headers = Object.keys(schoolsArr[0]);
        const csvRows = [headers.join(',')];
        for (const s of schoolsArr) {
          const row = headers.map(h => {
            let val = s[h] === null || s[h] === undefined ? '' : String(s[h]);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvRows.push(row.join(','));
        }
        fs.writeFileSync(path.join(DIST_DIR, 'data', 'GADCHIROLI_all_schools.csv'), csvRows.join('\n'));
        console.log(`  -> Generated dist/data/GADCHIROLI_all_schools.csv (${schoolsArr.length} records)`);
      }
    } catch (e) {
      console.warn('Could not parse embedded schools JSON for export:', e.message);
    }
  }
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

// Load Embedded HTML
const matchEmb = htmlContent.match(/window\.GADCHIROLI_SCHOOLS\s*=\s*(\[.*?\]);/s);
let embeddedCount = 0;
if (matchEmb) {
  try {
    const parsed = JSON.parse(matchEmb[1]);
    embeddedCount = parsed.length;
  } catch(e) {
    console.error('Failed to parse embedded dataset in index.html', e);
  }
}
console.log(`Embedded HTML Count        : ${embeddedCount}`);

if (embeddedCount !== 1968) {
  console.error(`❌ CRITICAL ERROR: Expected 1,968 records in index.html, found ${embeddedCount}`);
  process.exit(1);
}
console.log('✅ PASS: Exactly 1,968 verified school records embedded (Zero Data Loss).');

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
