import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === 'dist' || file === '.git') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // We only want to replace import lines that contain 'services'
    // Specifically looking for:
    // from '../services/...' or '../../services/...'
    // or from '@/services/...' if aliases are used
    if (content.includes('services/')) {
        content = content.replace(/from\s+['"]([^'"]+)services(\/[^'"]*)['"]/g, "from '$1api$2'");
        // also handle inline imports or types
        content = content.replace(/import\s*\(\s*['"]([^'"]+)services(\/[^'"]*)['"]\s*\)/g, "import('$1api$2')");
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
    }
});
