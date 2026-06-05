import fs from 'fs';

const logFile = 'C:\\Users\\ngoan\\.gemini\\antigravity-ide\\brain\\a47445ea-ecbc-4dee-b01e-7cd982395776\\.system_generated\\logs\\transcript.jsonl';

function inspect() {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < 50; i++) {
    const line = lines[i];
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      console.log(`Index ${obj.step_index}: source=${obj.source}, type=${obj.type}, status=${obj.status}`);
      if (obj.content && obj.content.includes('File Path:')) {
        console.log("-> FOUND File Path content!");
      }
    } catch (e) {
      // ignore
    }
  }
}

inspect();
