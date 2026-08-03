const fs = require('fs');
const path = require('path');
const readline = require('readline');
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
    console.log(`${colors.yellow}Please run 'npm install' or 'pnpm install' first.${colors.reset}`);
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

        const root = path.resolve(__dirname, '..');
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
    } catch (error) {
        const stderr = error.stdout ? error.stdout.toString() : (error.message || "");
        console.log(`\n${colors.red}${colors.bold}=== TS COMPILATION ERRORS ===${colors.reset}`);
        console.log(stderr);
        console.log(`${colors.red}${colors.bold}=============================${colors.reset}\n`);
        return false;
    }

    try {
        execSync('npx --no-install esbuild src/index.ts --bundle --minify --external:fs --external:path --format=iife --global-name=AbiLang --outfile=web/dist/abilang.min.js', { stdio: 'pipe' });
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

const net = require('net');

function findAvailablePort(startPort, callback) {
    const server = net.createServer();
    server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => callback(port));
    });
    server.on('error', () => {
        findAvailablePort(startPort + 1, callback);
    });
}

function startWebServer() {
    logInfo("Checking available port for HTTP Web Server...");
    findAvailablePort(8080, (port) => {
        logInfo(`Starting HTTP Web Server on port ${port}...`);
        const serverProcess = spawn('npx', ['-y', 'http-server', 'web', '-p', port.toString(), '--cors'], {
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
    });
}

function getConnectedMobileDevices() {
    const devices = [];
    try {
        const adbOut = execSync('adb devices', { stdio: 'pipe' }).toString();
        const lines = adbOut.split('\n').slice(1);
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2 && parts[1] === 'device') {
                devices.push({ id: parts[0], type: 'android' });
            }
        });
    } catch (e) {}

    try {
        const xcOut = execSync('xcrun xctrace list devices', { stdio: 'pipe' }).toString();
        const lines = xcOut.split('\n');
        lines.forEach(line => {
            if (line.includes('Simulator') || line.includes('iPhone') || line.includes('iPad')) {
                const match = line.match(/\(([^)]+)\)/);
                if (match) {
                    devices.push({ id: match[1], name: line.trim(), type: 'ios' });
                }
            }
        });
    } catch (e) {}

    return devices;
}

function startMobileApp() {
    const devices = getConnectedMobileDevices();
    if (devices.length === 0) {
        console.log(`\n${colors.red}${colors.bold}=== MOBILE RUN ERROR ===${colors.reset}`);
        console.log(`${colors.red}No connected mobile devices or running emulators found!${colors.reset}`);
        console.log(`${colors.yellow}Please connect an Android/iOS device via USB or start an emulator first.${colors.reset}`);
        console.log(`${colors.red}${colors.bold}========================${colors.reset}\n`);
        process.exit(1);
    }

    logSuccess(`Found ${devices.length} connected device(s): ${devices.map(d => d.id).join(', ')}`);
    logInfo("Starting Capacitor mobile application...");
    
    try {
        execSync('npx cap run android', { stdio: 'inherit' });
    } catch (err) {
        logError("Mobile run failed: " + err.message);
        process.exit(1);
    }
}

function startReplCLI() {
    logInfo("Starting CLI REPL...");
    const cliPath = path.resolve(__dirname, '../dist/cli.js');
    const replProcess = spawn('node', [cliPath], { stdio: 'inherit' });
    replProcess.on('exit', () => process.exit());
}

function main() {
    buildProject();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`\n${colors.cyan}${colors.bold}=========================================${colors.reset}`);
    console.log(`${colors.bold}  Select Target Platform to Run: ${colors.reset}`);
    console.log(`  1) Web Playground (Browser) ${colors.green}[Default]${colors.reset}`);
    console.log(`  2) Mobile Device (Android / iOS)`);
    console.log(`  3) CLI Interactive REPL Session`);
    console.log(`${colors.cyan}${colors.bold}=========================================${colors.reset}\n`);

    rl.question(`Enter selection [1]: `, (answer) => {
        rl.close();
        const choice = answer.trim() || '1';

        if (choice === '1') {
            startWatcher();
            startWebServer();
        } else if (choice === '2') {
            startMobileApp();
        } else if (choice === '3') {
            startReplCLI();
        } else {
            logError("Invalid option selected. Defaulting to Web Playground.");
            startWatcher();
            startWebServer();
        }
    });
}

main();
