const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    console.log("Compiling TypeScript files...");
    execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });

    // Inject shebang into dist/cli.js so `npx abi` and `npm link` work
    const cliPath = path.join(__dirname, '../dist/cli.js');
    let cliContent = fs.readFileSync(cliPath, 'utf-8');
    cliContent = cliContent.replace(/^\uFEFF/, '');
    cliContent = cliContent.replace(/^#![^\n]*\n/, '');
    fs.writeFileSync(cliPath, cliContent, { encoding: 'utf-8' });
    fs.chmodSync(cliPath, '755');

    // Sync static assets from root into web/ (flowchart, CSS, HTML docs)
    const root = path.join(__dirname, '..');
    const webDir = path.join(root, 'web');
    const assetsToCopy = [
        'abilang_flowchart.png', 'theme.css', 'style.css', 'documents.css',
        'documents.html', 'index.html', 'docs.html',
        'favicon.ico', 'favicon.png', 'apple-touch-icon.png'
    ];
    assetsToCopy.forEach(asset => {
        const src = path.join(root, asset);
        const dest = path.join(webDir, asset);
        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    });


    console.log("Bundling for web...");
    execSync('npx esbuild src/index.ts --bundle --minify --external:fs --external:path --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'inherit' });

    console.log("Build completed successfully!");
} catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
}
