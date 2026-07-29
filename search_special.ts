import fs from 'fs';
import path from 'path';

function scan(dir: string) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.name.toLowerCase().includes('coin_') || file.name.includes('\\')) {
        console.log('FOUND:', fullPath);
      }
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'proc', 'sys', 'dev', 'lib', 'lib64'].includes(file.name)) {
          scan(fullPath);
        }
      }
    }
  } catch (e: any) {
    // ignore
  }
}

console.log('--- SCANNING ALL FROM ROOT ---');
scan('/');
console.log('--- SCANNING END ---');
