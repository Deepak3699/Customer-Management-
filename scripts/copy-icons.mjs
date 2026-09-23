import fs from 'fs';
import path from 'path';

const publicDir = 'e:\\PROJECTS\\7th Sem\\shop-online\\public';
const src = path.join(publicDir, 'app logo.png');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(src, path.join(publicDir, 'icon-192.png'));
  fs.copyFileSync(src, path.join(publicDir, 'icon-512.png'));
  fs.copyFileSync(src, path.join(publicDir, 'favicon.ico'));
  console.log('✅ Icons successfully copied to public directory');
} else {
  console.error('❌ Source logo not found');
}
