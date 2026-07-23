const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    console.log("Compiling TypeScript files...");
    execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });

    const rootDist = path.join(__dirname, '../dist');
    const abilangDist = path.join(__dirname, '../abilang/dist');
    if (!fs.existsSync(abilangDist)) {
        fs.mkdirSync(abilangDist, { recursive: true });
    }
    fs.readdirSync(rootDist).forEach(file => {
        fs.copyFileSync(path.join(rootDist, file), path.join(abilangDist, file));
    });

    console.log("Bundling for web...");
    execSync('npx esbuild src/index.ts --bundle --minify --external:fs --external:path --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'inherit' });
    
    console.log("Build completed successfully!");
} catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
}
