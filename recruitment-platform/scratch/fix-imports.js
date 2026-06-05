const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../template');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    if (!content.includes('import React')) {
      content = content.replace('import { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";');
      fs.writeFileSync(p, content, 'utf-8');
      console.log('Fixed: ' + file);
    }
  }
});
