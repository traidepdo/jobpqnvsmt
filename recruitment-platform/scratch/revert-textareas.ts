import fs from 'fs';
import path from 'path';

const templateDir = path.join(process.cwd(), 'template');

function revertFiles() {
  const files = fs.readdirSync(templateDir);
  for (const file of files) {
    if (file.endsWith('.jsx')) {
      const filePath = path.join(templateDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Replace >{...}</textarea> with />
      const updated = content.replace(/>\s*\{[\s\S]*?\}\s*<\/textarea>/g, ' />');
      if (content !== updated) {
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`Reverted textareas in: ${file}`);
      }
    }
  }
}

revertFiles();
