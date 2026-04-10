import fs from 'fs';
import path from 'path';

// 1. Rename files to lowercase in components/ui
const uiDir = './src/components/ui';
if (fs.existsSync(uiDir)) {
  fs.readdirSync(uiDir).forEach(file => {
    const lower = file.toLowerCase();
    if (file !== lower) {
      // Rename to a temp name first to avoid case-insensitive FS issues
      fs.renameSync(path.join(uiDir, file), path.join(uiDir, file + '.tmp'));
      fs.renameSync(path.join(uiDir, file + '.tmp'), path.join(uiDir, lower));
      console.log(`Renamed ${file} to ${lower}`);
    }
  });
}

// 2. Update all imports to use lowercase
const walkSync = (dir: string, filelist: string[] = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const newContent = content.replace(/from\s+['"]@\/components\/ui\/([^'"]+)['"]/g, (match, p1) => {
    changed = true;
    return `from '@/components/ui/${p1.toLowerCase()}'`;
  });
  if (changed) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated imports in ${file}`);
  }
});
