const fs = require('fs');
const path = require('path');

const logFile = 'C:\\Users\\ngoan\\.gemini\\antigravity-ide\\brain\\a47445ea-ecbc-4dee-b01e-7cd982395776\\.system_generated\\logs\\transcript.jsonl';

function extract() {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  
  // Store the largest content for each file name
  const bestContents = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // Checking if this contains VIEW_FILE response content or similar
      const output = obj.content;
      if (output && output.includes('File Path:') && output.includes('Template')) {
        const filePathMatch = output.match(/File Path:\s*`file:\/\/\/(.*?)`/);
        if (filePathMatch) {
          const filePath = filePathMatch[1];
          const fileName = path.basename(filePath);
          if (fileName.includes('Template') && fileName.endsWith('.jsx')) {
            // Extract the original content lines
            const contentLines = output.split('\n');
            const cleanLines = [];
            for (const cl of contentLines) {
              const lineMatch = cl.match(/^\d+:\s([\s\S]*)$/);
              if (lineMatch) {
                cleanLines.push(lineMatch[1]);
              }
            }
            
            if (cleanLines.length > 0) {
              const linesCount = cleanLines.length;
              const fullContent = cleanLines.join('\n');
              
              if (!bestContents[fileName] || linesCount > bestContents[fileName].linesCount) {
                bestContents[fileName] = { linesCount, content: fullContent };
                console.log(`Found better segment for ${fileName}: ${linesCount} lines`);
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Write all recovered files
  for (const [fileName, data] of Object.entries(bestContents)) {
    const destDir = path.join(process.cwd(), 'template');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, fileName);
    fs.writeFileSync(destPath, data.content, 'utf-8');
    console.log(`RESTORED: ${destPath} with ${data.linesCount} lines!`);
  }
}

extract();
