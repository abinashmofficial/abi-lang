const fs = require('fs');
const path = require('path');

const filename = path.resolve('my-project/abicore/screens/docx.abx');
let fileContent = fs.readFileSync(filename, 'utf8');

let script = 'const fs = require("fs");\nconst path = require("path");\nconst fn = function(require, console, context = {}) {\nconst __parts = [];\nwith(context) {\n';

let processedContent = fileContent;
const renderRegex = /render\s+(\w+)\s+from\s+"([^"]+)"/g;
const imports = [];
let match;
while ((match = renderRegex.exec(fileContent)) !== null) {
    imports.push({ name: match[1], path: match[2] });
}
processedContent = processedContent.replace(renderRegex, '');

// Strip layouts
processedContent = processedContent.replace(/<Layout\b[^>]*>([\s\S]*?)<\/Layout>/g, '$1');
processedContent = processedContent.replace(/<Layout\b[^>]*\/>/g, '');

const importLines = imports.map(imp => {
    const resolved = path.resolve('my-project/abicore/screens', imp.path);
    return `const ${imp.name} = require(${JSON.stringify(resolved)});`;
}).join('\n');

script = importLines + '\n' + script;

processedContent = processedContent.replace(/<script prepare>([\s\S]*?)<\/script>/g, (m, code) => {
    let processedCode = code;
    processedCode = processedCode.replace(/import\s+(\w+)\s+from\s+"([^"]+)"/g, (m, name, impPath) => {
        const resolved = path.resolve('my-project/abicore/screens', impPath);
        return `const ${name} = require(${JSON.stringify(resolved)});`;
    });
    processedCode = processedCode.replace(/import\s+({[^}]+})\s+from\s+"([^"]+)"/g, (m, vars, impPath) => {
        const resolved = path.resolve('my-project/abicore/screens', impPath);
        return `const ${vars} = require(${JSON.stringify(resolved)});`;
    });
    processedCode = processedCode.replace(/\bexport\s+(?:(const|let|var)\s+)?(\w+)\s*=/g, (m, keyword, name) => {
        return `context.${name} =`;
    });
    const matches = [...processedCode.matchAll(/\bexport\s+(function|class)\s+(\w+)\b/g)];
    processedCode = processedCode.replace(/\bexport\s+(function|class)\s+(\w+)\b/g, '$1 $2');
    matches.forEach(m => {
        const name = m[2];
        processedCode += `\ncontext.${name} = ${name};`;
    });
    return `<% ${processedCode} %>`;
});

processedContent = processedContent.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (match, expr) => {
    return `<%= ${expr.trim()} %>`;
});

const codeRegex = /<%([\s\S]*?)%>/g;
let index = 0;
while ((match = codeRegex.exec(processedContent)) !== null) {
    script += `__parts.push(${JSON.stringify(processedContent.slice(index, match.index))});\n`;
    const code = match[1].trim();
    if (code.startsWith('=')) {
        script += `__parts.push(${code.slice(1)});\n`;
    } else {
        script += `${code}\n`;
    }
    index = codeRegex.lastIndex;
}
script += `__parts.push(${JSON.stringify(processedContent.slice(index))});\n`;
script += `}\nreturn __parts.join("");\n};\nfn.isAbiLangTemplate = true;\nmodule.exports = fn;\n`;

const lines = script.split('\n');
lines.forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
});
