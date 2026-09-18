import fs from 'fs';
import path from 'path';

const src = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\c96af4fb-ef6d-49af-bbd1-72560619ab23\\salhotra_store_logo_1789730897321.jpg';
const publicDir = 'e:\\PROJECTS\\7th Sem\\shop-online\\public';

if (fs.existsSync(src)) {
  fs.copyFileSync(src, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(src, path.join(publicDir, 'icon-192.png'));
  fs.copyFileSync(src, path.join(publicDir, 'icon-512.png'));
  fs.copyFileSync(src, path.join(publicDir, 'favicon.ico'));
  console.log('✅ Icons successfully copied to public directory');
} else {
  console.error('❌ Source logo not found');
}
