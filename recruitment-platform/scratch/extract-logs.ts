import fs from 'fs';
import path from 'path';

const logFile = 'C:\\Users\\ngoan\\.gemini\\antigravity-ide\\brain\\a47445ea-ecbc-4dee-b01e-7cd982395776\\.system_generated\\logs\\transcript.jsonl';

function extract() {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  
  // Store the largest content for each file name
  const bestContents: Record<string, { linesCount: number, content: string }> = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.source === 'MODEL' && obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('File Path:')) {
        const filePathMatch = obj.content.match(/File Path:\s*`file:\/\/\/(.*?)`/);
        if (filePathMatch) {
          const filePath = filePathMatch[1];
          const fileName = path.basename(filePath);
          if (fileName.includes('Template') && fileName.endsWith('.jsx')) {
            // Extract the original content lines
            const contentLines = obj.content.split('\n');
            const cleanLines: string[] = [];
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
    const destPath = path.join('template', fileName);
    fs.writeFileSync(destPath, data.content, 'utf-8');
    console.log(`RESTORED: ${destPath} with ${data.linesCount} lines!`);
  }
}

extract();
