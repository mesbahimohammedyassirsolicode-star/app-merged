import fs from 'fs';

const filePath = './src/pages/UsersPage.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startIndex = 17; // Line 18 in 1-based is index 17
const endIndex = 109; // Line 110 in 1-based is index 109

const schemaLines = lines.slice(startIndex, endIndex + 1);

const schemaContent = `import * as z from 'zod';\n\n` + schemaLines.join('\n') + `\n\nexport { userSchema, type UserFormValues, baseSchema };\n`;

fs.writeFileSync('./src/schemas/userSchemas.ts', schemaContent, 'utf8');

const newLines = [
    ...lines.slice(0, startIndex),
    `import { userSchema, type UserFormValues } from '../schemas/userSchemas';`,
    ...lines.slice(endIndex + 1)
];

const newContent = newLines.join('\n').replace(`import * as z from 'zod';\n`, ''); // maybe remove the inner zod import if no longer needed, but let's just keep simple
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Extraction complete');
