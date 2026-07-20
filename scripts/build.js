const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');
const tempDir = path.join(__dirname, '../temp_ts');

// 1. Create temp directory
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

// 2. Copy src/*.abi to temp_ts/*.ts
const files = fs.readdirSync(srcDir);
files.forEach(file => {
    if (file.endsWith('.abi')) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(tempDir, file.replace('.abi', '.ts'));
        fs.copyFileSync(srcPath, destPath);
    }
});

try {
    // 3. Compile using tsc
    execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });

    const rootDist = path.join(__dirname, '../dist');
    const abilangDist = path.join(__dirname, '../abilang/dist');
    if (!fs.existsSync(abilangDist)) {
        fs.mkdirSync(abilangDist, { recursive: true });
    }
    fs.readdirSync(rootDist).forEach(file => {
        fs.copyFileSync(path.join(rootDist, file), path.join(abilangDist, file));
    });

    // 4. Bundle for browser using esbuild
    console.log("Bundling for web...");
    execSync('npx esbuild temp_ts/index.ts --bundle --minify --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'inherit' });
    
    console.log("Build completed successfully!");
} catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
} finally {
    // 5. Clean up temp_ts
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
