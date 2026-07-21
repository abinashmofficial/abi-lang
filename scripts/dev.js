const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const srcDir = path.resolve(__dirname, '../src');
const webDir = path.resolve(__dirname, '../web');

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

const nodeModulesDir = path.resolve(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesDir)) {
    console.log(`\n${colors.red}${colors.bold}=== DEPENDENCY ERROR ===${colors.reset}`);
    console.log(`${colors.yellow}The node_modules folder is missing.${colors.reset}`);
    console.log(`${colors.yellow}Please run 'npm install' first to install the dependencies.${colors.reset}`);
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
    
    try {
        execSync('npx --no-install tsc --project tsconfig.json', { stdio: 'pipe' });
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
        console.log(`\n${colors.red}${colors.bold}=== TS COMPILATION ERRORS ===${colors.reset}`);
        console.log(stderr);
        console.log(`${colors.red}${colors.bold}=============================${colors.reset}\n`);
        return false;
    }

    try {
        execSync('npx --no-install esbuild src/index.ts --bundle --minify --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'pipe' });
    } catch (error) {
        logError("Bundler failed: " + (error.stderr ? error.stderr.toString() : error.message));
        return false;
    }

    logSuccess("Build updated! Reflected changes to web page.");
    return true;
}

let watchDebounceTimeout;
function startWatcher() {
    logInfo(`Watching for compiler changes in: ${colors.bold}src/*${colors.reset}`);
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.ts')) return;
        
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

const initialSucceeded = buildProject();
if (!initialSucceeded) {
    logError("Initial build failed. Starting watcher and server anyway for editing...");
}

startWatcher();
startWebServer();
