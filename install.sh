#!/bin/bash
set -e

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required to install AbiLang." >&2
    exit 1
fi



SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "┌──────────────────────────────────────────────┐"
echo "│                                              │"
echo "│           ⚡ Welcome to AbiLang              │"
echo "│               Installer v1.0                 │"
echo "│                                              │"
echo "└──────────────────────────────────────────────┘"
echo ""

if [ -t 0 ]; then
    TTY_IN=/dev/stdin
elif [ -e /dev/tty ]; then
    TTY_IN=/dev/tty
else
    TTY_IN=/dev/stdin
fi

if [ -z "$PROJECT_NAME" ]; then
    read -r -p "Enter project name [abilang]: " PROJECT_NAME_INPUT <"$TTY_IN"
    PROJECT_NAME="${PROJECT_NAME_INPUT:-abilang}"
fi

if [ -z "$PORT" ]; then
    read -r -p "Enter port number [3000]: " PORT_INPUT <"$TTY_IN"
    PORT="${PORT_INPUT:-3000}"
fi

if [ -z "$LANG_CHOICE" ]; then
    echo ""
    echo "Select Script Language Mode:"
    echo "  1) JavaScript (Default - Standard JS with optional TS annotations)"
    echo "  2) TypeScript (Strict TS with interfaces and type checking)"
    read -r -p "Enter choice [1]: " LANG_CHOICE_INPUT <"$TTY_IN"
    LANG_CHOICE="${LANG_CHOICE_INPUT:-1}"
fi

if [ -z "$DB_CHOICE" ]; then
    echo ""
    echo "Select a database type:"
    echo "  1) MySQL"
    echo "  2) PostgreSQL"
    echo "  3) MongoDB"
    echo "  4) SQLite"
    echo "  5) None"
    read -r -p "Enter choice [5]: " DB_CHOICE_INPUT <"$TTY_IN"
    DB_CHOICE="${DB_CHOICE_INPUT:-5}"
fi

if [ -z "$CSS_CHOICE" ]; then
    echo ""
    echo "Select a CSS Framework / Design System:"
    echo "  1) Bootstrap 5 (Modern Grid & Components)"
    echo "  2) Tailwind CSS (Utility-First Responsive UI)"
    echo "  3) Materialize CSS (Google Material Design)"
    echo "  4) Bulma (Pure Flexbox Framework)"
    echo "  5) Foundation (Advanced Responsive Framework)"
    echo "  6) Custom Vanilla CSS (Zero External Dependencies)"
    read -r -p "Enter choice [1]: " CSS_CHOICE_INPUT <"$TTY_IN"
    CSS_CHOICE="${CSS_CHOICE_INPUT:-1}"
fi

case "$CSS_CHOICE" in
    2)
        CSS_NAME="Tailwind CSS"
        CSS_LINK='<script src="https://cdn.tailwindcss.com"></script>'
        ;;
    3)
        CSS_NAME="Materialize CSS"
        CSS_LINK='<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">'
        ;;
    4)
        CSS_NAME="Bulma CSS"
        CSS_LINK='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">'
        ;;
    5)
        CSS_NAME="Foundation CSS"
        CSS_LINK='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css">'
        ;;
    6)
        CSS_NAME="Vanilla CSS"
        CSS_LINK=""
        ;;
    *)
        CSS_NAME="Bootstrap 5"
        CSS_LINK='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">'
        ;;
esac

case "$DB_CHOICE" in
    1)
        DB_DRIVER="mysql"
        DB_DEFAULT_PORT="3306"
        ;;
    2)
        DB_DRIVER="pgsql"
        DB_DEFAULT_PORT="5432"
        ;;
    3)
        DB_DRIVER="mongodb"
        DB_DEFAULT_PORT="27017"
        ;;
    4)
        DB_DRIVER="sqlite"
        DB_DEFAULT_PORT=""
        ;;
    *)
        DB_DRIVER="none"
        DB_DEFAULT_PORT=""
        ;;
esac

if [ "$DB_DRIVER" != "none" ]; then
    echo ""
    if [ -z "$DB_DATABASE" ]; then
        read -r -p "Enter database name: " DB_DATABASE <"$TTY_IN"
    fi
    if [ -z "$DB_USERNAME" ]; then
        read -r -p "Enter database username: " DB_USERNAME <"$TTY_IN"
    fi
    if [ -z "$DB_PASSWORD" ]; then
        read -r -s -p "Enter database password: " DB_PASSWORD <"$TTY_IN"
        echo ""
    fi
else
    DB_DATABASE=""
    DB_USERNAME=""
    DB_PASSWORD=""
fi

INSTALL_START_TIME=$(date +%s)

print_progress() {
    local percent=$1
    local message=$2
    local width=30
    local completed=$((width * percent / 100))
    local remaining=$((width - completed))
    local current_time=$(date +%s)
    local elapsed=$((current_time - INSTALL_START_TIME))
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))
    local timer_str=$(printf "%02dm:%02ds" "$minutes" "$seconds")
    local bar=""
    for ((i=0; i<completed; i++)); do bar+="#"; done
    for ((i=0; i<remaining; i++)); do bar+="-"; done
    printf "\r\033[K[\033[32m%s\033[0m] %3d%% (\033[33m%s\033[0m) - %s" "$bar" "$percent" "$timer_str" "$message"
    if [ "$percent" -eq 100 ]; then
        echo ""
    fi
}

print_progress 10 "Creating project directory structure..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

mkdir -p dist
mkdir -p public/css
mkdir -p public/js
mkdir -p public/images
mkdir -p abicore/screens/layout abicore/screens/components
mkdir -p abicore/handlers
mkdir -p abicore/entities
mkdir -p abicore/navigation
mkdir -p abicore/support
mkdir -p abicore/constants
mkdir -p abicore/lang/en

APP_NAME=$(echo "$PROJECT_NAME" | tr '[:lower:]' '[:upper:]')
API_KEY="xyz123secret"

print_progress 25 "Generating .env configuration..."
{
    echo "PORT=$PORT"
    echo "APP_NAME=$APP_NAME"
    echo "APP_LANG=en"

    echo "DB_DRIVER=$DB_DRIVER"
    if [ "$DB_DRIVER" != "none" ]; then
        echo "DB_HOST=127.0.0.1"
    else
        echo "DB_HOST="
    fi
    echo "DB_PORT=$DB_DEFAULT_PORT"
    echo "DB_DATABASE=$DB_DATABASE"
    echo "DB_USERNAME=$DB_USERNAME"
    echo "DB_PASSWORD=$DB_PASSWORD"

} > .env

# Base repository URL
BASE_URL="https://raw.githubusercontent.com/abinashmofficial/abi-lang/main"

# 3. Create package.json
print_progress 40 "Configuring package.json..."
cat << EOF > package.json
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "The Progressive Scripting Language Project with Bootstrap and Layouts",
  "main": "dist/index.js",
  "bin": {
    "abi": "./dist/cli.js"
  },
  "scripts": {
    "build": "node scripts/build.js",
    "start": "node scripts/dev.js",
    "web": "node scripts/dev.js",
    "reload": "node server.js",
    "dev": "node scripts/dev.js",
    "test": "node dist/cli.js abicore/navigation/routes.abx",
    "test:all": "node dist/cli.js abicore/navigation/routes.abx"
  },
  "dependencies": {
    "esbuild": "^0.19.11"
  },
  "devDependencies": {}
}
EOF

# 4. Download or copy source binary components
print_progress 55 "Copying binary core & scripts..."
if [ -d "$SCRIPT_DIR/dist" ]; then
    for file in cli.js index.js interpreter.js lexer.js parser.js types.js; do
        if [ -f "$SCRIPT_DIR/dist/$file" ]; then
            cp "$SCRIPT_DIR/dist/$file" "dist/$file"
        else
            curl -fsSL "$BASE_URL/dist/$file" -o "dist/$file"
        fi
    done
else
    for file in cli.js index.js interpreter.js lexer.js parser.js types.js; do
        curl -fsSL "$BASE_URL/dist/$file" -o "dist/$file"
    done
fi

mkdir -p scripts
if [ -d "$SCRIPT_DIR/scripts" ]; then
    cp -r "$SCRIPT_DIR/scripts/"* "scripts/"
fi

cat << 'DEV_EOF' > scripts/dev.js
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

function logInfo(msg) {
    console.log(`${colors.cyan}[AbiLang Dev]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
    console.log(`${colors.green}[AbiLang Dev] SUCCESS:${colors.reset} ${colors.bold}${msg}${colors.reset}`);
}

function logError(msg) {
    console.log(`${colors.red}[AbiLang Dev] ERROR:${colors.reset} ${colors.bold}${msg}${colors.reset}`);
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

function startWatcher() {
    try {
        const installSyntaxPath = path.resolve(__dirname, 'install-syntax.js');
        if (fs.existsSync(installSyntaxPath)) {
            execSync(`node "${installSyntaxPath}"`, { stdio: 'pipe' });
        }
    } catch (e) {}

    const rootDir = path.resolve(__dirname, '..');
    fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
        if (!filename || (!filename.endsWith('.abx') && !filename.endsWith('.abi') && !filename.endsWith('.abilang'))) return;
        try {
            const installSyntaxPath = path.resolve(__dirname, 'install-syntax.js');
            if (fs.existsSync(installSyntaxPath)) {
                execSync(`node "${installSyntaxPath}"`, { stdio: 'pipe' });
            }
        } catch (e) {}
    });
}

function startWebServer() {
    startWatcher();
    logInfo("Checking available port for HTTP Web Server...");
    findAvailablePort(8080, (port) => {
        logInfo(`Starting HTTP Web Server on port ${port}...`);
        let serverProcess;
        if (fs.existsSync(path.resolve(__dirname, '../server.js'))) {
            process.env.PORT = port.toString();
            serverProcess = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });
        } else {
            serverProcess = spawn('npx', ['-y', 'http-server', 'web', '-p', port.toString(), '--cors'], { stdio: 'inherit', shell: true });
        }
        
        serverProcess.on('error', (err) => {
            logError("HTTP Server failed to start: " + err.message);
        });

        process.on('SIGINT', () => {
            if (serverProcess) serverProcess.kill('SIGINT');
            process.exit();
        });
        
        process.on('SIGTERM', () => {
            if (serverProcess) serverProcess.kill('SIGTERM');
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
            startWebServer();
        } else if (choice === '2') {
            startMobileApp();
        } else if (choice === '3') {
            startReplCLI();
        } else {
            startWebServer();
        }
    });
}

main();
DEV_EOF

# Ensure dist/cli.js shebang and executable permissions
chmod +x dist/cli.js
sed -i '1s/^\xef\xbb\xbf//' dist/cli.js
sed -i $'s/\r$//' dist/cli.js

print_progress 70 "Generating screens and UI components..."

cat << EOF > abicore/screens/layout/header.abx
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AbiLang - Modern Responsive Web Portal</title>
    $CSS_LINK
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/public/css/theme.css?v=1.2">
    <link rel="stylesheet" href="/public/css/style.css?v=1.2">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-app);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .navbar-custom {
            background: var(--bg-pane);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
        }
        .navbar-custom .navbar-brand,
        .navbar-custom .nav-link,
        .navbar-custom a {
            color: var(--text-main) !important;
        }
        .hero-section {
            background: radial-gradient(circle at top center, rgba(143, 92, 255, 0.18), transparent 60%);
            padding: 90px 0;
            flex: 1;
        }
        .card-custom {
            background: var(--bg-pane);
            backdrop-filter: blur(8px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            color: var(--text-main);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-custom:hover {
            transform: translateY(-6px);
            border-color: var(--abi-dark-blue);
            box-shadow: 0 12px 30px rgba(143, 92, 255, 0.15);
        }
        .text-gradient {
            background: linear-gradient(135deg, var(--abi-rose), var(--abi-cyan));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .btn-gradient {
            background: linear-gradient(135deg, var(--abi-dark-blue), var(--abi-cyan));
            border: none;
            color: #ffffff;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .btn-gradient:hover {
            opacity: 0.95;
            transform: scale(1.02);
            color: #ffffff;
            box-shadow: 0 0 15px rgba(143, 92, 255, 0.4);
        }
        .btn-outline-secondary {
            color: var(--text-main) !important;
            border-color: var(--border-color) !important;
        }
        .btn-outline-secondary:hover {
            background: var(--bg-pane) !important;
            color: var(--text-main) !important;
        }
        footer {
            background: var(--bg-app);
            border-top: 1px solid var(--border-color);
            padding: 24px 0;
            font-size: 0.9rem;
            color: var(--text-muted);
        }
        .version-badge-pill {
            background: var(--bg-pane);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            border-radius: 999px;
            padding: 4px 14px;
            font-size: 13px;
            display: inline-block;
        }
        h1, h2, h3, h4, h5, h6 { color: var(--text-main); }
        p, li, span { color: inherit; }
        strong { color: var(--text-main); }
    </style>
</head>
<body class="dark-theme">
    <nav class="navbar navbar-expand-lg navbar-custom py-3">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/">
                <span class="badge me-2 fs-5 px-3 abi-logo-badge">A</span>
                <span class="fw-bold tracking-wider brand-title-text">Abi<span class="text-gradient">Lang</span></span>
            </a>
            <div class="d-flex align-items-center gap-3 ms-auto">
                <a href="https://abinashmofficial.github.io/abi-lang/documents.html" style="color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500;" onmouseover="this.style.color='var(--abi-green)'" onmouseout="this.style.color='var(--text-muted)'">Documentation</a>
                <button id="theme-toggle" class="btn border-0">
                    <span id="theme-toggle-icon">☀</span>
                </button>
            </div>
        </div>
    </nav>
EOF

cat << 'EOF' > abicore/lang/en/messages.json
{
  "title": "The Progressive Scripting Language",
  "subtitle": "An approachable, highly performant and versatile scripting language designed for Abinash, running natively on all platform engines.",
  "get_started": "Get Started",
  "view_docs": "View Docs",
  "system_info": "System Information",
  "platform": "Platform",
  "architecture": "Architecture",
  "uptime": "Uptime",
  "seconds": "seconds",
  "memory": "Memory"
}
EOF

cat << 'EOF' > abicore/screens/components/profile_card.abx
<script>
    const name = profileName || "Abinash";
    const role = profileRole || "Lead Platform Architect";
</script>

<div class="card card-custom p-4 text-start mx-auto mb-4" style="max-width: 600px; border-left: 4px solid var(--abi-green);">
    <h5 class="mb-2" style="color: var(--text-main);">{{ name }}</h5>
    <p class="mb-0" style="color: var(--text-muted);">Role: <span style="color: var(--text-main);">{{ role }}</span></p>
</div>
EOF

cat << 'EOF' > abicore/screens/components/landing_body.abx
import ProfileCard from "components/profile_card";

<script>
    const system = {
        platform: "Linux",
        architecture: "x64",
        uptime: 3600,
        memory: 2048
    };
</script>

<section class="hero-section d-flex align-items-center">
    <div class="container">
        <div class="row align-items-center justify-content-center">
            <div class="col-lg-9 text-center">
                <div class="version-badge-pill mb-3">
                    AbiLang v1.2.0 (Bootstrap Cloud Release)
                </div>
                <h1 class="display-3 fw-bold mb-4">
                    {{ lang.title }}
                </h1>
                <p class="lead mb-5 fs-5" style="color: var(--text-muted);">
                    {{ lang.subtitle }}
                </p>
                <div class="d-flex justify-content-center gap-3 mb-5">
                    <a class="btn btn-gradient btn-lg px-4" href="https://abinashmofficial.github.io/abi-lang/documents.html">{{ lang.get_started }}</a>
                    <a class="btn btn-outline-secondary btn-lg px-4" href="https://github.com/abinashmofficial/abi-lang" target="_blank">{{ lang.view_docs }}</a>
                </div>
                <div class="mb-4">
                    <ProfileCard />
                </div>
                <div class="card card-custom p-4 text-start mx-auto" style="max-width: 600px;">
                    <h5 class="mb-3" style="color: var(--text-main);">{{ lang.system_info }}</h5>
                    <div class="row fs-6" style="color: var(--text-muted);">
                        <div class="col-6 mb-2"><strong style="color: var(--text-main);">{{ lang.platform }}:</strong> {{ system.platform }}</div>
                        <div class="col-6 mb-2"><strong style="color: var(--text-main);">{{ lang.architecture }}:</strong> {{ system.architecture }}</div>
                        <div class="col-6 mb-2"><strong style="color: var(--text-main);">{{ lang.uptime }}:</strong> {{ system.uptime }} {{ lang.seconds }}</div>
                        <div class="col-6 mb-2"><strong style="color: var(--text-main);">{{ lang.memory }}:</strong> {{ system.memory }}MB</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
EOF

cat << 'EOF' > abicore/screens/index.abi
import Header from "layout/header";
import LandingBody from "components/landing_body";
import Footer from "layout/footer";

<script>
    import messages from "../lang/en/messages.json";
    
    const lang = messages || { title: "AbiLang", subtitle: "Welcome" };
    const profileName = "Abinash";
    const profileRole = "Lead Platform Architect";
</script>

<style>
    body {
        --bg-app: #f3f0ff;
        --bg-pane: #fcfbff;
        --border-color: #d4c8ff;
        --abi-green: #4CAF50;
        --abi-dark-blue: #6d28d9;
        --abi-cyan: #00cfff;
        --abi-rose: #ff4fcf;
        --text-main: #23124f;
        --text-muted: #75669f;
        --btn-text: #ffffff;
        --editor-bg: #fdfdfd;
    }

    body.dark-theme {
        --bg-app: #090014;
        --bg-pane: #15082b;
        --border-color: #32225a;
        --abi-green: #7bff00;
        --abi-dark-blue: #8f5cff;
        --abi-cyan: #00eaff;
        --abi-rose: #ff4fd8;
        --text-main: #ffffff;
        --text-muted: #b6add3;
        --btn-text: #090014;
        --editor-bg: #272822;
    }

    .text-white, .text-light { color: var(--text-main) !important; }
    .text-muted, .text-white-50 { color: var(--text-muted) !important; }
    strong { color: var(--text-main); }
    p { color: var(--text-muted); }
    h1, h2, h3, h4, h5, h6 { color: var(--text-main); }

    .abi-logo-badge {
        background: linear-gradient(135deg, var(--abi-green), var(--abi-dark-blue)) !important;
        color: var(--btn-text) !important;
        font-weight: 800;
        box-shadow: 0 2px 8px rgba(66, 184, 131, 0.25);
    }
    .brand-title-text { color: var(--text-main) !important; }
    .text-gradient {
        background: linear-gradient(135deg, var(--abi-green), var(--abi-cyan)) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
    }
    .btn-gradient {
        background: linear-gradient(135deg, var(--abi-green), var(--abi-cyan)) !important;
        border: none !important;
        color: var(--btn-text) !important;
    }
    .btn-gradient:hover {
        background: linear-gradient(135deg, var(--abi-dark-blue), var(--abi-cyan)) !important;
        color: var(--btn-text) !important;
    }
    #theme-toggle {
        border-radius: 50% !important;
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        min-height: 38px !important;
        padding: 0 !important;
        line-height: 1 !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid var(--border-color) !important;
        color: var(--text-main) !important;
        transition: transform 0.2s, background-color 0.2s;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
    }
    #theme-toggle:hover {
        transform: scale(1.1) rotate(15deg);
        background: var(--bg-pane) !important;
        border-color: var(--abi-green) !important;
    }
    #view-portal-link { color: var(--abi-green) !important; }
</style>

<Header />
<LandingBody />
<Footer />
EOF

cat << 'EOF' > abicore/screens/layout/footer.abx
    <footer class="text-center">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-4 text-md-start mb-3 mb-md-0">
                    <a href="/" id="view-portal-link" style="color: #c084fc; text-decoration: none; font-weight: 500;">
                        View Landing Portal
                    </a>
                </div>
                <div class="col-md-4 mb-3 mb-md-0" style="color: var(--text-muted);">
                    Progressive Language Platform
                </div>
                <div class="col-md-4 text-md-end" style="color: var(--text-muted);">
                    Made for Abinash
                </div>
            </div>
        </div>
    </footer>
    <script src="/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/public/js/abilang.min.js?v=1.2"></script>
    <script src="/public/js/app.js?v=1.2"></script>
</body>
</html>
EOF

cat << 'EOF' > abicore/screens/layout/layout.abx
render Header from "layout/header"
render Body from context.viewPage
render Footer from "layout/footer"

<Header />
<Body />
<Footer />
EOF

cat << 'EOF' > abicore/handlers/handler.abx
class Handler {
    public func index() {
        return screen("index")
    }

    public func docs() {
        return screen("docs")
    }
}
EOF

cat << 'EOF' > abicore/navigation/routes.abx
include("abicore/handlers/handler.abx")

route("get", "/", "handler@index", "home")
route("get", "/docs", "handler@docs", "docs")
EOF

cat << 'EOF' > abicore/navigation/routes.abi
include("abicore/handlers/handler.abx")

route("get", "/", "handler@index", "home")
route("get", "/docs", "handler@docs", "docs")
EOF



cat << 'EOF' > server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Interpreter, BuiltinFunction } = require('./dist/interpreter');
const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');

const abxLoader = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const esbuild = require('esbuild');
    const isReact = /require\(['"]react['"]\)/.test(content) || 
                    /from\s+['"]react['"]/i.test(content) || 
                    /import\s+React/i.test(content);
    const isTemplate = !isReact;
    let transpiled;
    const resolveTemplatePath = (importPath) => {
        let directPath = path.resolve(path.dirname(filename), importPath);
        if (fs.existsSync(directPath)) return directPath;
        if (fs.existsSync(directPath + '.abx')) return directPath + '.abx';
        if (fs.existsSync(directPath + '.abi')) return directPath + '.abi';
        
        let relativeToScreens = importPath.startsWith('abicore/screens/') ? importPath : 'abicore/screens/' + importPath;
        let screensPath = path.resolve(process.cwd(), relativeToScreens);
        if (fs.existsSync(screensPath)) return screensPath;
        if (fs.existsSync(screensPath + '.abx')) return screensPath + '.abx';
        if (fs.existsSync(screensPath + '.abi')) return screensPath + '.abi';
        
        return directPath;
    };

    if (isTemplate) {
        let script = 'const fs = require("fs");\nconst path = require("path");\nconst fn = function(require, console, context = {}) {\nif (!context.beam) context.beam = function(val) { console.log("[BEAM]", val); return val; };\nif (!context.dx) context.dx = function(val) { console.log("%c[AbiLang dx() Dump]", "background: #1e1e2e; color: #f5c2e7; font-weight: bold; padding: 4px 8px; border-radius: 4px;", val); throw new Error("[Execution Halted by dx()]"); };\nconst __parts = [];\nwith(context) {\n';
        let processedContent = content;
        processedContent = processedContent.replace(/(?:export\s+component|export|component)\s+(\w+)\s*\{([\s\S]*?)\}/g, '$2');
        const importRegex = /(?:export\s+)?(?:load|import|inject|render)\s+(\w+)\s+from\s+(?:['"]([^'"]+)['"]|([a-zA-Z0-9_\.]+))/g;
        let m;
        const imports = [];
        while ((m = importRegex.exec(processedContent)) !== null) {
            imports.push({
                match: m[0],
                alias: m[1],
                quotedPath: m[2],
                varName: m[3]
            });
        }
        imports.reverse().forEach(imp => {
            const alias = imp.alias;
            const tagRegex = new RegExp('<' + alias + '([^>]*?)(?:\\/>|>(?:[\\s\\S]*?<\\/' + alias + '>)?)', 'g');
            const hasTag = tagRegex.test(processedContent);
            
            let inlineReplacement = '';
            if (imp.quotedPath) {
                let resolved = resolveTemplatePath(imp.quotedPath);
                inlineReplacement = `<%= require(${JSON.stringify(resolved)})(require, console, Object.assign({}, context)) %>`;
            } else {
                inlineReplacement = `<%= require(path.resolve(process.cwd(), ${imp.varName}))(require, console, Object.assign({}, context)) %>`;
            }

            if (hasTag) {
                processedContent = processedContent.replace(imp.match, '');
                processedContent = processedContent.replace(tagRegex, (match, attrStr) => {
                    const attrs = [];
                    const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:['"]([^'"]*)['"]|{([\s\S]*?)}|([a-zA-Z0-9_\.]+))/g;
                    let am;
                    while ((am = attrRegex.exec(attrStr)) !== null) {
                        const key = am[1];
                        let valExpr = '';
                        if (am[2] !== undefined) {
                            valExpr = JSON.stringify(am[2]);
                        } else if (am[3] !== undefined) {
                            valExpr = am[3].trim();
                        } else if (am[4] !== undefined) {
                            valExpr = am[4];
                        }
                        attrs.push(`${JSON.stringify(key)}: ${valExpr}`);
                    }
                    const attrsObj = `{ ${attrs.join(', ')} }`;
                    
                    if (imp.quotedPath) {
                        let resolved = resolveTemplatePath(imp.quotedPath);
                        return `<%= require(${JSON.stringify(resolved)})(require, console, Object.assign({}, context, ${attrsObj})) %>`;
                    } else {
                        return `<%= require(path.resolve(process.cwd(), ${imp.varName}))(require, console, Object.assign({}, context, ${attrsObj})) %>`;
                    }
                });
            } else {
                processedContent = processedContent.replace(imp.match, inlineReplacement);
            }
        });

        const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
        processedContent = processedContent.replace(includeRegex, (match, subPath) => {
            let resolved = resolveTemplatePath(subPath);
            return `<%= require(${JSON.stringify(resolved)})(require, console, context) %>`;
        });

        const pluginRegex = /@plugin\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?(?:,\s*(.+?))?\)/g;
        processedContent = processedContent.replace(pluginRegex, (match, moduleName, funcName, argsStr) => {
            return `<%= (function() {
                const plugin = require(${JSON.stringify(moduleName)});
                if (${JSON.stringify(funcName)}) {
                    const func = plugin[${JSON.stringify(funcName)}];
                    if (typeof func === "function") {
                        let args = [];
                        if (${JSON.stringify(argsStr || "")}) {
                            args = eval("[" + ${JSON.stringify(argsStr || "")} + "]");
                        }
                        return func(...args);
                    }
                    return plugin[${JSON.stringify(funcName)}] || "";
                }
                if (typeof plugin === "function") {
                    return plugin();
                }
                return String(plugin);
            })() %>`;
        });

        processedContent = processedContent.replace(/<script>([\s\S]*?)<\/script>/g, (match, code) => {
            let processedCode = code.trim();
            processedCode = `
                function $state(initialValue) {
                    let val = initialValue;
                    return { get value() { return val; }, set value(v) { val = v; } };
                }
                function $fetch(url, defaultData = null) {
                    return defaultData;
                }
                ` + processedCode;
            processedCode = processedCode.replace(/\bimport\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, (m, vars, importPath) => {
                let includePath = path.resolve(path.dirname(filename), importPath);
                if (!fs.existsSync(includePath)) {
                    includePath = path.resolve(process.cwd(), importPath);
                }
                const randomId = Math.floor(Math.random() * 1000000);
                return `const _import_ctx_${randomId} = {}; require(${JSON.stringify(includePath)})(require, console, _import_ctx_${randomId}); const { ${vars} } = _import_ctx_${randomId};`;
            });
            processedCode = processedCode.replace(/\b(?:const|let|var)\s+(\w+)\s*=/g, (m, name) => {
                return `context.${name} =`;
            });
            processedCode = processedCode.replace(/\bexport\s+(?:(const|let|var)\s+)?(\w+)\s*=/g, (m, keyword, name) => {
                return `context.${name} =`;
            });
            const matches = [...processedCode.matchAll(/\b(?:export\s+)?(function|class)\s+(\w+)\b/g)];
            processedCode = processedCode.replace(/\b(?:export\s+)?(function|class)\s+(\w+)\b/g, '$1 $2');
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
        let match;
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
        transpiled = esbuild.transformSync(script, {
            loader: 'js',
            target: 'node18',
            format: 'cjs'
        }).code;
    } else {
        transpiled = esbuild.transformSync(content, {
            loader: 'jsx',
            target: 'node18',
            format: 'cjs'
        }).code;
    }
    module._compile(transpiled, filename);
};

require.extensions['.abx'] = abxLoader;
require.extensions['.abi'] = abxLoader;

const envFile = path.resolve('.env');
if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let val = parts.slice(1).join('=').trim();
                if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("\x27") && val.endsWith("\x27"))) {
                    val = val.substring(1, val.length - 1);
                }
                process.env[key] = val;
            }
        }
    });
}

let routes = [];
let interpreter;
const mimeTypes = {
    '.html': 'text/html',
    '.abx': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

class ServerIO {
    print(msg) {
        console.log(msg);
    }
    async input(prompt) { return ""; }
}

const io = new ServerIO();

async function loadRoutes() {
    routes = [];
    interpreter = new Interpreter(io);
    interpreter.globals.define("env", new BuiltinFunction(1, async (args) => {
        return process.env[String(args[0])] || "";
    }));
    interpreter.globals.define("include", new BuiltinFunction(1, async (args) => {
        const filePath = String(args[0]);
        let absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            absolutePath = path.resolve('abicore/' + filePath);
        }
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Include file not found: '${filePath}'`);
        }
        const source = fs.readFileSync(absolutePath, "utf-8");
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const statements = parser.parse();
        await interpreter.interpret(statements);
        return null;
    }));
    interpreter.globals.define("screen", new BuiltinFunction(1, async (args) => {
        const pathName = String(args[0]);
        const cleanPath = pathName.startsWith("abicore/screens/") ? pathName : "abicore/screens/" + pathName;
        return cleanPath.endsWith(".abx") ? cleanPath : cleanPath + ".abx";
    }));
    interpreter.globals.define("route", new BuiltinFunction(4, async (args) => {
        routes.push({
            method: String(args[0]).toLowerCase(),
            path: String(args[1]),
            action: String(args[2]),
            name: String(args[3])
        });
        return null;
    }));
    let routeFile = path.resolve('abicore/navigation/routes.abx');
    if (!fs.existsSync(routeFile)) {
        routeFile = path.resolve('abicore/navigation/routes.abi');
    }
    if (fs.existsSync(routeFile)) {
        const source = fs.readFileSync(routeFile, 'utf8');
        const lexer = new Lexer(source);
        const parser = new Parser(lexer.tokenize());
        await interpreter.interpret(parser.parse());
    }
}

function renderTemplate(filePath) {
    const resolved = path.resolve(filePath);
    if (require.cache[resolved]) {
        delete require.cache[resolved];
    }
    
    const layoutPath = path.resolve(path.dirname(filePath), 'layout/layout.abx');
    const isLayoutFile = resolved.includes('/layout/');
    
    if (!isLayoutFile && fs.existsSync(layoutPath)) {
        const fileContent = fs.readFileSync(resolved, 'utf8');
        const needsLayoutWrapper = !/<Header\b/.test(fileContent) && !/<Layout\b/.test(fileContent);
        if (needsLayoutWrapper) {
            if (require.cache[layoutPath]) {
                delete require.cache[layoutPath];
            }
            const exportedLayout = require(layoutPath);
            if (exportedLayout && exportedLayout.isAbiLangTemplate) {
                return exportedLayout(require, console, { viewPage: resolved });
            }
        }
    }
    
    const exported = require(resolved);
    if (exported && exported.isAbiLangTemplate) {
        return exported(require, console, {});
    }
    const React = require('react');
    const ReactDOMServer = require('react-dom/server');
    const element = React.isValidElement(exported) ? exported : React.createElement(exported);
    return ReactDOMServer.renderToStaticMarkup(element);
}

function clearAllCache() {
    Object.keys(require.cache).forEach(key => {
        if (key.endsWith('.abx') || key.includes('/handlers/') || key.includes('/entities/') || key.includes('/support/')) {
            delete require.cache[key];
        }
    });
}

function startWatcher() {
    const dirs = ['navigation', 'handlers', 'entities', 'support', 'screens'];
    dirs.forEach(dir => {
        const dirPath = path.resolve('abicore', dir);
        if (fs.existsSync(dirPath)) {
            fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                clearAllCache();
                loadRoutes().catch(console.error);
                console.log(`[Reload] Reloaded changes in abicore/${dir}/${filename}`);
            });
        }
    });
}

async function startServer() {
    await loadRoutes();
    startWatcher();

    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', async (key) => {
            if (key === '\u0003') {
                process.exit();
            }
            if (key === 'r' || key === 'R') {
                console.log('\n[Reloading...] Cleared all cache and reloaded routes.');
                clearAllCache();
                try {
                    await loadRoutes();
                    console.log('[Reload] Routes successfully reloaded.');
                } catch (err) {
                    console.error('[Reload Error] Failed to reload:', err.message);
                }
            }
        });
    }

    const server = http.createServer(async (req, res) => {
        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const urlPath = req.url.split('?')[0];

        if (urlPath === '/favicon.ico') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (urlPath === '/reload') {
            clearAllCache();
            await loadRoutes();
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Cache cleared and routes reloaded successfully!');
            return;
        }

        if (urlPath.startsWith('/public/')) {
            const filePath = path.join(__dirname, urlPath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath);
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(fs.readFileSync(filePath));
                return;
            }
        }

        if (urlPath.startsWith('/bootstrap/')) {
            const relPath = urlPath.slice('/bootstrap/'.length);
            const filePath = path.join(__dirname, 'node_modules', 'bootstrap', relPath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath);
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(fs.readFileSync(filePath));
                return;
            }
        }

        const route = routes.find(r => r.method === req.method.toLowerCase() && r.path === urlPath);
        if (route) {
            const parts = route.action.split('@');
            const handlerNamespace = parts[0];
            const actionName = parts[1];
            let handlerFunc = null;
            try { handlerFunc = interpreter.globals.get(actionName); } catch (e) { /* not a global func, check class below */ }

            const handlerClass = (() => {
                try { return interpreter.globals.get(handlerNamespace); } catch (e) {}
                try { return interpreter.globals.get(handlerNamespace.charAt(0).toUpperCase() + handlerNamespace.slice(1)); } catch (e) {}
                return null;
            })();
            if (handlerClass && handlerClass.declaration && handlerClass.declaration.type === "ClassDeclStatement") {
                const instance = await handlerClass.call(interpreter, []);
                const method = instance.klass.declaration.methods.find(m => m.name === actionName);
                if (method) {
                    const { BoundMethod } = require("./dist/interpreter");
                    handlerFunc = new BoundMethod(instance, method, instance.klass.closure);
                }
            }

            if (handlerFunc && typeof handlerFunc.call === 'function') {
                let screenFile = await handlerFunc.call(interpreter, []);
                if (screenFile && typeof screenFile === 'string') {
                    if (!screenFile.startsWith('abicore/')) {
                        screenFile = 'abicore/' + (screenFile.startsWith('screens/') ? screenFile : 'screens/' + screenFile);
                    }
                    let filePath = path.join(__dirname, screenFile);
                    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.abi')) {
                        filePath = filePath + '.abi';
                    }
                    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.abx')) {
                        filePath = filePath + '.abx';
                    }
                    if (fs.existsSync(filePath)) {
                        const content = renderTemplate(filePath);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content);
                        return;
                    }
                }
            }
        }

        // Fallback: If root URL '/' or no explicit route matched, render abicore/screens/index
        if (urlPath === '/' || routes.length === 0) {
            let indexPath = path.join(__dirname, 'abicore/screens/index.abi');
            if (!fs.existsSync(indexPath)) {
                indexPath = path.join(__dirname, 'abicore/screens/index.abx');
            }
            if (fs.existsSync(indexPath)) {
                try {
                    const content = renderTemplate(indexPath);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                    return;
                } catch (e) {
                    console.error('[Render Error]', e);
                }
            }
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    });

    let port = parseInt(process.env.PORT || 8080, 10);
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
            port++;
            server.listen(port, '127.0.0.1');
        } else {
            console.error(err);
            process.exit(1);
        }
    });
    server.on('listening', () => {
        console.log(`Server running at http://127.0.0.1:${port}/ (Press 'r' to reload)`);
    });
    server.listen(port, '127.0.0.1');
}

startServer().catch(err => {
    console.error(err);
    process.exit(1);
});
EOF

# 7. Create routing and helper/constant components
cat << 'EOF' > abicore/handlers/handler.abx
include("entities/entity.abx")

class Handler {
    public func index() {
        e = Entity()
        print "Calling entity: " + e.data()
        print "Database Config -> Host: " + DB_HOST + ", DB: " + DB_DATABASE
        return screen("index")
    }
}
EOF

cat << 'EOF' > abicore/entities/entity.abx
class Entity {
    public func data() {
        return "Entity data"
    }
}
EOF

cat << 'EOF' > abicore/support/helpers.abx
class Support {
    public func get_platform_info() {
        return "Running AbiLang " + VERSION + " by " + AUTHOR
    }
}
EOF

cat << 'EOF' > abicore/constants/constants.abx
APP_TITLE = "AbiLang Bootstrap Portal"
VERSION = "1.2.0"
AUTHOR = "Abinash"

DB_HOST = env("DB_HOST")
DB_PORT = env("DB_PORT")
DB_DATABASE = env("DB_DATABASE")
DB_USERNAME = env("DB_USERNAME")
DB_PASSWORD = env("DB_PASSWORD")
DB_DRIVER = env("DB_DRIVER")

if DB_DATABASE != "" or DB_HOST != "" {
    db_connect({ "driver": DB_DRIVER, "host": DB_HOST, "port": DB_PORT, "database": DB_DATABASE, "username": DB_USERNAME, "password": DB_PASSWORD })
}
EOF

cat << 'EOF' > abicore/navigation/routes.abx

include("constants/constants.abx")
include("support/helpers.abx")
include("handlers/handler.abx")

route("get", "/", "handler@index", "home")
EOF

# Create VS Code local settings for default syntax coloring
mkdir -p .vscode
cat << 'EOF' > .vscode/settings.json
{
  "files.associations": {
    "*.abi": "abilang",
    "*.ab": "abilang",
    "*.abilang": "abilang",
    "*.abx": "abilangui"
  }
}
EOF

# 8. Download or copy design assets (CSS, JS, layout etc.)
if [ -d "$SCRIPT_DIR/web" ]; then
    cp "$SCRIPT_DIR/web/app.js" public/js/app.js
    cp "$SCRIPT_DIR/web/style.css" public/css/style.css
    cp "$SCRIPT_DIR/web/theme.css" public/css/theme.css
    if [ -f "$SCRIPT_DIR/web/dist/abilang.min.js" ]; then
        cp "$SCRIPT_DIR/web/dist/abilang.min.js" public/js/abilang.min.js
    else
        curl -fsSL "$BASE_URL/web/dist/abilang.min.js" -o public/js/abilang.min.js
    fi
else
    curl -fsSL "$BASE_URL/web/app.js" -o public/js/app.js
    curl -fsSL "$BASE_URL/web/style.css" -o public/css/style.css
    curl -fsSL "$BASE_URL/web/theme.css" -o public/css/theme.css
    curl -fsSL "$BASE_URL/web/dist/abilang.min.js" -o public/js/abilang.min.js
fi

# 9. Configure global executables
chmod +x dist/cli.js

# Modify interpreter.js components to include standard route/include registration
node -e '
const fs = require("fs");
let content = fs.readFileSync("dist/interpreter.js", "utf8");
if (!content.includes("globals.define(\"include\"")) {
    content = content.replace("this.globals.define(\"render_ui\",", `this.globals.define("include", new BuiltinFunction(1, async (args) => {
            const filePath = String(args[0]);
            const fs = require("fs");
            const path = require("path");
            let absolutePath = path.resolve(filePath);
            if (!fs.existsSync(absolutePath)) {
                absolutePath = path.resolve("abicore/" + filePath);
            }
            if (!fs.existsSync(absolutePath) && fs.existsSync(absolutePath + ".abx")) {
                absolutePath = absolutePath + ".abx";
            }
            if (!fs.existsSync(absolutePath) && fs.existsSync(absolutePath + ".abi")) {
                absolutePath = absolutePath + ".abi";
            }
            if (!fs.existsSync(absolutePath)) {
                throw new Error(\`Include file not found: \\\x27\${filePath}\\\x27\`);
            }
            const source = fs.readFileSync(absolutePath, "utf-8");
            const lexer = new (require("./lexer").Lexer)(source);
            const tokens = lexer.tokenize();
            const parser = new (require("./parser").Parser)(tokens);
            const statements = parser.parse();
            for (const statement of statements) {
                await this.execute(statement);
            }
            return null;
        }));
        this.globals.define("screen", new BuiltinFunction(1, async (args) => {
            const pathName = String(args[0]);
            const cleanPath = pathName.startsWith("abicore/screens/") ? pathName : "abicore/screens/" + pathName;
            if (cleanPath.endsWith(".abi") || cleanPath.endsWith(".abx")) return cleanPath;
            return cleanPath + ".abi";
        }));
        this.globals.define("env", new BuiltinFunction(1, async (args) => {
            const key = String(args[0]);
            return (typeof process !== "undefined" && process.env) ? (process.env[key] || "") : "";
        }));
        this.globals.define("route", new BuiltinFunction(4, async (args) => {
            const method = String(args[0]);
            const path = String(args[1]);
            const action = String(args[2]);
            const name = String(args[3]);
            this.io.print(\`[Route Registered] \${method.toUpperCase()} \${path} -> \${action} (\${name})\\n\`);
            if (path === "/") {
                const parts = action.split("@");
                const handlerNamespace = parts[0];
                const actionName = parts[1];
                let handlerFunc = this.globals.get(actionName);

                const handlerClass = this.globals.get(handlerNamespace) || this.globals.get(handlerNamespace.charAt(0).toUpperCase() + handlerNamespace.slice(1));
                if (handlerClass && handlerClass.declaration && handlerClass.declaration.type === "ClassDeclStatement") {
                    const instance = await handlerClass.call(this, []);
                    const method = instance.klass.findMethod(actionName);
                    if (method) {
                        const { BoundMethod } = require("./interpreter");
                        handlerFunc = new BoundMethod(instance, method, instance.klass.closure);
                    }
                }

                if (handlerFunc && typeof handlerFunc.call === "function") {
                    const result = await handlerFunc.call(this, []);
                    this.io.print(\`[Route Executed] Result: \${result}\\n\`);
                } else {
                    this.io.print(\`[Route Error] Action \\\x27\${actionName}\\\x27 not found in global scope.\\n\`);
                }
            }
            return null;
        }));
        this.globals.define("render_ui",`);
    fs.writeFileSync("dist/interpreter.js", content, "utf8");
}
'

# Patch app.js: 
# Ensure regular expression syntax error is fixed if present
node -e '
const fs = require("fs");
let appJs = fs.readFileSync("public/js/app.js", "utf8");
if (appJs.includes("(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\(()")) {
    appJs = appJs.replace("(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\(()", "(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\())");
    fs.writeFileSync("public/js/app.js", appJs, "utf8");
}
'

# Mini-minify styling files
node -e '
const fs = require("fs");
["style.css", "theme.css"].forEach(file => {
    let path = "public/css/" + file;
    if (fs.existsSync(path)) {
        let code = fs.readFileSync(path, "utf8");
        code = code.replace(/\/\*[\s\S]*?\*\//g, "");
        fs.writeFileSync(path, code, "utf8");
    }
});
'

# Complete dependency link
print_progress 85 "Installing dependencies..."
(
    while true; do
        sleep 1
        current_time=$(date +%s)
        elapsed=$((current_time - INSTALL_START_TIME))
        minutes=$((elapsed / 60))
        seconds=$((elapsed % 60))
        timer_str=$(printf "%02dm:%02ds" "$minutes" "$seconds")
        printf "\r\033[K[\033[32m########################------\033[0m]  85%% (\033[33m%s\033[0m) - Installing dependencies..." "$timer_str"
    done
) &
TIMER_PID=$!

npm install --omit=dev --silent
kill $TIMER_PID > /dev/null 2>&1 || true
wait $TIMER_PID 2>/dev/null || true

npm link --force > /dev/null 2>&1

# Install syntax highlighting support for local IDEs (VS Code, VS Code Insiders, Vim, Sublime)
if [ -f "scripts/install-syntax.js" ]; then
    node "scripts/install-syntax.js" > /dev/null 2>&1
elif [ -f "$SCRIPT_DIR/scripts/install-syntax.js" ]; then
    node "$SCRIPT_DIR/scripts/install-syntax.js" > /dev/null 2>&1
fi

if [ -f "abicore/navigation/routes.abx" ]; then
    sed -i '1{/^#!/d}' dist/cli.js
    node dist/cli.js abicore/navigation/routes.abx > /dev/null 2>&1 || true
fi

print_progress 100 "Installation completed!"

echo ""
echo "╭─────────────────────────────────────────────╮"
echo "│  🚀 AbiLang                                 │"
echo "│                                             │"
echo "│  ✓ Project created successfully             │"
echo "│                                             │"
echo "│  📂 $(pwd)"
echo "│                                             │"
echo "│  ▶ Start development                        │"
echo "│     pnpm start                              │"
echo "╰─────────────────────────────────────────────╯"
echo ""