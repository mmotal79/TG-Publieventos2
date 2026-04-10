import fs from 'fs';
import path from 'path';

const walkSync = (dir: string, filelist: string[] = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES' || err.code === 'EPERM') return;
      throw err;
    }
  });
  return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.tsx'));

const replacements = [
  ['@/components/ui/accordion', '@/components/ui/Accordion'],
  ['@/components/ui/badge', '@/components/ui/Badge'],
  ['@/components/ui/button', '@/components/ui/Button'],
  ['@/components/ui/card', '@/components/ui/Card'],
  ['@/components/ui/dialog', '@/components/ui/Dialog'],
  ['@/components/ui/input', '@/components/ui/Input'],
  ['@/components/ui/label', '@/components/ui/Label'],
  ['@/components/ui/select', '@/components/ui/Select'],
  ['@/components/ui/table', '@/components/ui/Table'],
  ['@/components/ui/tabs', '@/components/ui/Tabs']
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
