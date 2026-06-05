const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../template');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');

    // 1. Destructure onSave in export default function Template...
    content = content.replace(
      /export default function Template([A-Za-z]+)\(\{\s*user\s*=\s*\{\},\s*resume\s*=\s*\{\}\s*\}\)\s*\{/,
      'export default function Template$1({ user = {}, resume = {}, onSave }) {'
    );

    // 2. Add if (resume?.id) return; inside the mount useEffect
    // The pattern to match: useEffect(() => { \n const savedUser
    const useEffectPattern = /useEffect\(\(\)\s*=>\s*\{\s*const savedUser/g;
    content = content.replace(useEffectPattern, (match) => {
      return `useEffect(() => {\n        if (resume?.id) return;\n        const savedUser`;
    });

    // 3. Update handleSave
    const handleSavePattern = /const handleSave = \(\) => \{\s*localStorage\.setItem\("pqjobs_cv_user",[\s\S]*?setShowSaveToast\(true\);[\s\S]*?setTimeout\(\(\) => setShowSaveToast\(false\), 2500\);\s*\};/;
    content = content.replace(handleSavePattern, `const handleSave = () => {
        if (onSave) {
            onSave(userData, resumeData);
        } else {
            localStorage.setItem("pqjobs_cv_user", JSON.stringify(userData));
            localStorage.setItem("pqjobs_cv_resume", JSON.stringify(resumeData));
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2500);
        }
    };`);

    fs.writeFileSync(p, content, 'utf-8');
    console.log('Updated template logic in: ' + file);
  }
});
