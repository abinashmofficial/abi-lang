const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const srcDir = path.resolve(__dirname, '../src');
const tempDir = path.resolve(__dirname, '../temp_ts');
const webDir = path.resolve(__dirname, '../web');

// Utility for colored terminal outputs
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

// Check if node_modules folder exists
const nodeModulesDir = path.resolve(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesDir)) {
    console.log(`\n${colors.red}${colors.bold}=== DEPENDENCY ERROR ===${colors.reset}`);
    console.log(`${colors.yellow}The node_modules folder is missing.${colors.reset}`);
    console.log(`${colors.yellow}Please run 'npm install' first to install the TypeScript compiler and other dependencies before running 'npm run web'.${colors.reset}`);
    console.log(`${colors.red}${colors.bold}========================${colors.reset}\n`);
    process.exit(1);
}

function logInfo(msg) {
    console.log(`${colors.cyan}[AbiLang Dev]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
    console.log(`${colors.green}[AbiLang Dev] SUCCESS:${colors.reset} ${colors.bold}${msg}${colors.reset}`);
}

function logError(msg) {
    console.log(`${colors.red}[AbiLang Dev] ERROR:${colors.reset} ${colors.bold}${msg}${colors.reset}`);
}

function buildProject() {
    logInfo("Building compiler...");
    
    // 1. Create temp directory
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir);

    // 2. Copy src/*.abi to temp_ts/*.ts
    try {
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
            if (file.endsWith('.abi')) {
                const srcPath = path.join(srcDir, file);
                const destPath = path.join(tempDir, file.replace('.abi', '.ts'));
                fs.copyFileSync(srcPath, destPath);
            }
        });
    } catch (e) {
        logError("Failed to copy source files: " + e.message);
        return false;
    }

    // 3. Run tsc (strictly local)
    try {
        execSync('npx --no-install tsc --project tsconfig.build.json', { stdio: 'pipe' });
        const rootDist = path.resolve(__dirname, '../dist');
        const abilangDist = path.resolve(__dirname, '../abilang/dist');
        if (!fs.existsSync(abilangDist)) {
            fs.mkdirSync(abilangDist, { recursive: true });
        }
        fs.readdirSync(rootDist).forEach(file => {
            fs.copyFileSync(path.join(rootDist, file), path.join(abilangDist, file));
        });
    } catch (error) {
        const stderr = error.stdout ? error.stdout.toString() : (error.message || "");
        formatAndPrintTscErrors(stderr);
        cleanupTemp();
        return false;
    }

    // 4. Run esbuild (strictly local)
    try {
        execSync('npx --no-install esbuild temp_ts/index.ts --bundle --minify --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'pipe' });
    } catch (error) {
        logError("Bundler failed: " + (error.stderr ? error.stderr.toString() : error.message));
        cleanupTemp();
        return false;
    }

    cleanupTemp();
    logSuccess("Build updated! Reflected changes to web page.");
    return true;
}

function cleanupTemp() {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

function formatAndPrintTscErrors(output) {
    console.log(`\n${colors.red}${colors.bold}=== TS COMPILATION ERRORS ===${colors.reset}`);
    const lines = output.split('\n');
    lines.forEach(line => {
        if (!line.trim()) return;
        
        // Match line like: temp_ts/lexer.ts(15,5): error TS2322: ...
        // or: temp_ts/lexer.ts:15:5 - error TS2322: ...
        let mappedLine = line;
        
        // 1. Map temp_ts/*.ts to src/*.abi
        mappedLine = mappedLine.replace(/temp_ts\/([a-zA-Z0-9_\-]+)\.ts/g, 'src/$1.abi');
        
        // Highlight errors in red
        if (mappedLine.includes('error TS')) {
            console.log(`${colors.red}${mappedLine}${colors.reset}`);
        } else {
            console.log(mappedLine);
        }
    });
    console.log(`${colors.red}${colors.bold}=============================${colors.reset}\n`);
}

// Watch directory for changes
let watchDebounceTimeout;
function startWatcher() {
    logInfo(`Watching for compiler changes in: ${colors.bold}src/*${colors.reset}`);
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.abi')) return;
        
        // Debounce watch triggers
        clearTimeout(watchDebounceTimeout);
        watchDebounceTimeout = setTimeout(() => {
            logInfo(`Change detected in ${filename}. Rebuilding...`);
            buildProject();
        }, 100);
    });
}

function startWebServer() {
    logInfo("Starting HTTP Web Server...");
    const serverProcess = spawn('npx', ['-y', 'http-server', 'web', '-p', '8080'], {
        stdio: 'inherit',
        shell: true
    });
    
    serverProcess.on('error', (err) => {
        logError("HTTP Server failed to start: " + err.message);
    });

    process.on('SIGINT', () => {
        serverProcess.kill('SIGINT');
        process.exit();
    });
    
    process.on('SIGTERM', () => {
        serverProcess.kill('SIGTERM');
        process.exit();
    });
}

// Initial Build
const initialSucceeded = buildProject();
if (!initialSucceeded) {
    logError("Initial build failed. Starting watcher and server anyway for editing...");
}

startWatcher();
startWebServer();
