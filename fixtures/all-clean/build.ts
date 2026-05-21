// Build script that uses typescript compiler programmatically
import ts from 'typescript';

const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
console.log('TypeScript version:', ts.version);
