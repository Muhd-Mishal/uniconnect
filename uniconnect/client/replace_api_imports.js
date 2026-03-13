import fs from 'fs';
import path from 'path';

const searchStr = "'../services/api'";
const replaceStr = "'../utils/api'";

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchStr)) {
                content = content.replace(new RegExp(searchStr, 'g'), replaceStr);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated imports in: ${fullPath}`);
            }
        }
    }
}

// Target client/src directory
walkDir('c:\\Users\\Muhammed Mishal\\newreact - Copy (2)\\uniconnect\\client\\src');
console.log('Finished updating imports.');
