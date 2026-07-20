#!/bin/bash
set -e

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required to install AbiLang." >&2
    exit 1
fi

# Helper function to print to terminal
print_msg() {
    local msg="$1"
    if [ -c /dev/tty ]; then
        echo "$msg" > /dev/tty
    else
        echo "$msg"
    fi
}

# Helper function to prompt user for input (handles interactive and non-interactive cases)
prompt_user() {
    local prompt_msg="$1"
    local default_val="$2"
    local result_var="$3"
    local allow_empty="$4"
    local input_val
    
    if [ -c /dev/tty ]; then
        printf "%s" "$prompt_msg" > /dev/tty
        if read -r input_val < /dev/tty; then
            if [ -z "$input_val" ]; then
                if [ "$allow_empty" != "true" ]; then
                    input_val="$default_val"
                else
                    input_val=""
                fi
            fi
        else
            input_val="$default_val"
        fi
    else
        input_val="$default_val"
    fi
    
    eval "$result_var=\"$input_val\""
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Ask for project name (defaults to abilang if empty)
prompt_user "Enter project name [abilang]: " "abilang" PROJECT_NAME

# Create and navigate to the project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

mkdir -p dist
mkdir -p assets/css
mkdir -p assets/js
mkdir -p assets/images
mkdir -p view/layout
mkdir -p controller
mkdir -p model
mkdir -p routes
mkdir -p helpers
mkdir -p constants
mkdir -p lang/en

# 2. Ask if they want to configure environment variables (.env)
prompt_user "Do you want to configure environment variables (.env)? (y/n) [y]: " "y" CREATE_ENV

if [[ "$CREATE_ENV" =~ ^[Yy]$ ]]; then
    # Ask port question - if not given, leave empty (first value is empty default)
    prompt_user "Enter PORT [3000]: " "3000" PORT "true"
    
    prompt_user "Do you want to configure database details? (y/n) [y]: " "y" CONFIGURE_DB
    
    DATABASE_TYPE=""
    DATABASE_URL=""
    
    if [[ "$CONFIGURE_DB" =~ ^[Yy]$ ]]; then
        print_msg ""
        print_msg "Select Database Type:"
        print_msg "1) mysql"
        print_msg "2) postgres"
        print_msg "3) mongodb"
        print_msg "4) supabase"
        print_msg "5) sqlite"
        print_msg "6) sqlite3"
        
        prompt_user "Enter choice (1-6) [3]: " "3" DB_CHOICE
        
        case $DB_CHOICE in
            1)
                DATABASE_TYPE="mysql"
                prompt_user "Enter DB_HOST [localhost]: " "localhost" DB_HOST
                prompt_user "Enter DB_PORT [3306]: " "3306" DB_PORT
                prompt_user "Enter DB_DATABASE [proflujo_academy]: " "proflujo_academy" DB_DATABASE
                prompt_user "Enter DB_USERNAME [proflujo]: " "proflujo" DB_USERNAME
                prompt_user "Enter DB_PASSWORD [letmein1!]: " "letmein1!" DB_PASSWORD
                DEFAULT_URL="mysql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE"
                ;;
            2)
                DATABASE_TYPE="postgres"
                prompt_user "Enter DB_HOST [localhost]: " "localhost" DB_HOST
                prompt_user "Enter DB_PORT [5432]: " "5432" DB_PORT
                prompt_user "Enter DB_DATABASE [proflujo_academy]: " "proflujo_academy" DB_DATABASE
                prompt_user "Enter DB_USERNAME [proflujo]: " "proflujo" DB_USERNAME
                prompt_user "Enter DB_PASSWORD [letmein1!]: " "letmein1!" DB_PASSWORD
                DEFAULT_URL="postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE"
                ;;
            3)
                DATABASE_TYPE="mongodb"
                DEFAULT_URL="mongodb://localhost:27017/$PROJECT_NAME"
                ;;
            4)
                DATABASE_TYPE="supabase"
                DEFAULT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
                ;;
            5)
                DATABASE_TYPE="sqlite"
                DEFAULT_URL="sqlite://database.db"
                ;;
            6)
                DATABASE_TYPE="sqlite3"
                DEFAULT_URL="sqlite3://database.db"
                ;;
            *)
                DATABASE_TYPE="mongodb"
                DEFAULT_URL="mongodb://localhost:27017/$PROJECT_NAME"
                ;;
        esac
        
        if [ "$DATABASE_TYPE" != "postgres" ] && [ "$DATABASE_TYPE" != "mysql" ]; then
            prompt_user "Enter DATABASE_URL [$DEFAULT_URL]: " "$DEFAULT_URL" DATABASE_URL
        fi
    fi
    
    prompt_user "Enter API_KEY [xyz123secret]: " "xyz123secret" API_KEY
    
    # Generate default uppercase APP_NAME matching project name
    APP_NAME=$(echo "$PROJECT_NAME" | tr '[:lower:]' '[:upper:]')
    
    # Write .env file
    {
        if [ -n "$PORT" ]; then
            echo "PORT=$PORT"
        fi
        if [ -n "$APP_NAME" ]; then
            echo "APP_NAME=$APP_NAME"
        fi
        if [ "$DATABASE_TYPE" = "postgres" ]; then
            echo "DB_CONNECTION=pgsql"
            echo "DB_HOST=$DB_HOST"
            echo "DB_PORT=$DB_PORT"
            echo "DB_DATABASE=$DB_DATABASE"
            echo "DB_USERNAME=$DB_USERNAME"
            echo "DB_PASSWORD=$DB_PASSWORD"
        elif [ "$DATABASE_TYPE" = "mysql" ]; then
            echo "DB_CONNECTION=mysql"
            echo "DB_HOST=$DB_HOST"
            echo "DB_PORT=$DB_PORT"
            echo "DB_DATABASE=$DB_DATABASE"
            echo "DB_USERNAME=$DB_USERNAME"
            echo "DB_PASSWORD=$DB_PASSWORD"
        elif [ -n "$DATABASE_TYPE" ]; then
            echo "DATABASE_TYPE=\"$DATABASE_TYPE\""
            echo "DATABASE_URL=\"$DATABASE_URL\""
        else
            echo "DB_HOST="
            echo "DB_PORT="
            echo "DB_DATABASE="
            echo "DB_USERNAME="
            echo "DB_PASSWORD="
        fi
        if [ -n "$API_KEY" ]; then
            echo "API_KEY=$API_KEY"
        fi
    } > .env
    
    echo ".env file created successfully!"
fi

# Base repository URL
BASE_URL="https://raw.githubusercontent.com/abinashmofficial/abi-lang/main"

# 3. Create package.json
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
    "start": "node dist/cli.js",
    "web": "node server.js"
  },
  "dependencies": {
    "bootstrap": "^5.3.3"
  },
  "devDependencies": {}
}
EOF

# 4. Download or copy source binary components
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

cat << 'EOF' > view/layout/header.ui
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AbiLang - Modern Bootstrap Web Portal</title>
    <link rel="stylesheet" href="/bootstrap/dist/css/bootstrap.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/theme.css?v=1.2">
    <link rel="stylesheet" href="/assets/css/style.css?v=1.2">
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
        footer {
            background: var(--bg-app);
            border-top: 1px solid var(--border-color);
            padding: 24px 0;
            font-size: 0.9rem;
            color: var(--text-muted);
        }
    </style>
</head>
<body class="dark-theme">
    <nav class="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="#">
                <span class="badge me-2 fs-5 px-3 abi-logo-badge">A</span>
                <span class="fw-bold tracking-wider brand-title-text">Abi<span class="text-gradient">Lang</span></span>
            </a>
            <div class="d-flex align-items-center gap-3 ms-auto">
                <a href="/docs" style="color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500;" onmouseover="this.style.color='var(--abi-green)'" onmouseout="this.style.color='var(--text-muted)'">Documentation</a>
                <button id="theme-toggle" class="btn btn-outline-secondary border-0" style="border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    <span id="theme-toggle-icon">☀</span>
                </button>
            </div>
        </div>
    </nav>
EOF

cat << 'EOF' > lang/en/messages.json
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

cat << 'EOF' > view/index.ui
@include("view/layout/header.ui")
<%
const fs = require('fs');
const path = require('path');
const os = require('os');
let lang = {};
try {
    lang = JSON.parse(fs.readFileSync(path.resolve('lang/en/messages.json'), 'utf8'));
} catch (e) {
    lang = { title: "AbiLang", subtitle: "Welcome" };
}
%>
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

    .text-white {
        color: var(--text-main) !important;
    }
    .text-light {
        color: var(--text-main) !important;
    }
    .text-muted {
        color: var(--text-muted) !important;
    }
    .text-white-50 {
        color: var(--text-muted) !important;
    }
    strong {
        color: var(--text-main);
    }

    .abi-logo-badge {
        background: linear-gradient(135deg, var(--abi-green), var(--abi-dark-blue)) !important;
        color: var(--btn-text) !important;
        font-weight: 800;
        box-shadow: 0 2px 8px rgba(66, 184, 131, 0.25);
    }
    .brand-title-text {
        color: var(--text-main) !important;
    }
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
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid var(--border-color) !important;
        color: var(--text-main) !important;
        transition: transform 0.2s, background-color 0.2s;
    }
    #theme-toggle:hover {
        transform: scale(1.1) rotate(15deg);
        background: var(--bg-pane) !important;
        border-color: var(--abi-green) !important;
    }
    #view-portal-link {
        color: var(--abi-green) !important;
    }
</style>
<section class="hero-section d-flex align-items-center">
    <div class="container">
        <div class="row align-items-center justify-content-center">
            <div class="col-lg-9 text-center">
                <div class="badge bg-secondary bg-opacity-25 text-light mb-3 px-3 py-2 border border-secondary border-opacity-50">
                    AbiLang v1.2.0 (Bootstrap Cloud Release)
                </div>
                <h1 class="display-3 fw-bold mb-4 text-white">
                    <%= lang.title %>
                </h1>
                <p class="lead text-muted mb-5 fs-5">
                    <%= lang.subtitle %>
                </p>
                <div class="d-flex justify-content-center gap-3 mb-5">
                    <button class="btn btn-gradient btn-lg px-4" id="launch-btn"><%= lang.get_started %></button>
                    <a class="btn btn-outline-secondary btn-lg px-4" href="https://github.com/abinashmofficial/abi-lang" target="_blank"><%= lang.view_docs %></a>
                </div>
                <div class="card card-custom p-4 text-start mx-auto" style="max-width: 600px;">
                    <h5 class="text-white mb-3"><%= lang.system_info %></h5>
                    <div class="row text-muted fs-6">
                        <div class="col-6 mb-2"><strong><%= lang.platform %>:</strong> <%= os.platform() %></div>
                        <div class="col-6 mb-2"><strong><%= lang.architecture %>:</strong> <%= os.arch() %></div>
                        <div class="col-6 mb-2"><strong><%= lang.uptime %>:</strong> <%= Math.floor(os.uptime()) %> <%= lang.seconds %></div>
                        <div class="col-6 mb-2"><strong><%= lang.memory %>:</strong> <%= Math.floor(os.freemem() / 1024 / 1024) %>MB / <%= Math.floor(os.totalmem() / 1024 / 1024) %>MB</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
@include("view/layout/footer.ui")
EOF

cat << 'EOF' > view/layout/footer.ui
    <footer class="text-center">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-4 text-md-start mb-3 mb-md-0">
                    <a href="#" id="view-portal-link" style="color: #c084fc; text-decoration: none; font-weight: 500;">
                        View Landing Portal
                    </a>
                </div>
                <div class="col-md-4 mb-3 mb-md-0 text-white-50">
                    Progressive Language Platform
                </div>
                <div class="col-md-4 text-md-end text-white-50">
                    Made for Abinash
                </div>
            </div>
        </div>
    </footer>
    <script src="/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/assets/js/abilang.min.js?v=1.2"></script>
    <script src="/assets/js/app.js?v=1.2"></script>
</body>
</html>
EOF

cat << 'EOF' > view/docs.ui
@include("view/layout/header.ui")
<section class="portal-installation" style="margin-top: 20px; border-top: none;">
    <div class="install-container">
        <h2 class="install-section-title">Documentation V1</h2>
        <p class="install-section-subtitle">Discover what makes AbiLang unique and learn how to use its methods, controllers, and routing step-by-step.</p>
        
        <div class="os-tabs">
            <button class="os-tab-btn active" data-os="intro">Overview & Uniqueness</button>
            <button class="os-tab-btn" data-os="syntax">Syntax & Basic Rules</button>
            <button class="os-tab-btn" data-os="controllers">Controllers & Models</button>
            <button class="os-tab-btn" data-os="routing">Routing & Views</button>
        </div>

        <div class="install-code-blocks">
            <div class="os-content active" id="os-intro">
                <div class="cmd-group">
                    <span class="cmd-label">About AbiLang</span>
                    <p class="cmd-desc" style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">AbiLang is a progressive scripting language designed for clean structure, optimal execution speed, and simplicity. It allows writing expressive scripts with optional parentheses, clean brackets, and zero boilerplate code.</p>
                </div>
                <div class="cmd-group">
                    <span class="cmd-label">Why is it unique?</span>
                    <ul style="color: var(--text-muted); font-size: 14px; line-height: 1.8; padding-left: 20px; margin-top: 10px;">
                        <li><strong>Hybrid Architecture:</strong> Compiles and runs directly in Node.js on the backend, or bundles to clean standard JavaScript for runtime performance in web browsers.</li>
                        <li><strong>Procedural Scoping:</strong> Imports other scripts recursively using the global <code>include("path")</code> system, keeping functions, models, and constants within a shared environment.</li>
                        <li><strong>Cloud Fetch:</strong> Built-in async HTTP call methods (<code>fetch</code>) and JSON parsing utilities (<code>json_parse</code>) for smooth REST-database connectivity.</li>
                    </ul>
                </div>
                <div class="cmd-group">
                    <span class="cmd-label">Minimum System Requirements</span>
                    <ul style="color: var(--text-muted); font-size: 13px; line-height: 1.8; padding-left: 20px; margin-top: 10px;">
                        <li><strong>macOS:</strong> macOS 10.15+ (Catalina), Node.js v18.0.0+, npm v9.0.0+</li>
                        <li><strong>Linux:</strong> Ubuntu 20.04 LTS+ / Debian 11+ / Fedora 36+, Node.js v18.0.0+, Git installed</li>
                        <li><strong>Windows:</strong> Windows 10/11 (64-bit), PowerShell 5.1+ / PowerShell Core 7+, Node.js v18.0.0+, npm v9.0.0+</li>
                        <li><strong>Mobile:</strong> Android SDK API Level 30+ (Android 11+), Xcode 14+ (macOS only, for iOS), CocoaPods installed</li>
                    </ul>
                </div>
            </div>

            <div class="os-content" id="os-syntax">
                <div class="cmd-group">
                    <span class="cmd-label">1. Variables & Expressions</span>
                    <pre><code>greeting = "Hello world"
result = 100 + 50 * (4 / 2)
print greeting</code></pre>
                </div>
                <div class="cmd-group">
                    <span class="cmd-label">2. Standard Controls & Loops</span>
                    <pre><code>age = 18
if age >= 18 {
    print "Access authorized"
}

count = 1
while count <= 3 {
    print count
    count = count + 1
}</code></pre>
                </div>
            </div>

            <div class="os-content" id="os-controllers">
                <div class="cmd-group">
                    <span class="cmd-label">1. Default Controller (controller/controller.abi)</span>
                    <pre><code>include("model/model.abi")

func index() {
    return view("index")
}</code></pre>
                </div>
                <div class="cmd-group">
                    <span class="cmd-label">2. Creating and Extending Controllers</span>
                    <p class="cmd-desc" style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">To create a custom controller and inherit all functions from the base controller, include both the model and the base controller:</p>
                    <pre><code>include("model/model.abi")

include("controller/controller.abi")

func show_profile() {
    return view("profile")
}</code></pre>
                </div>
            </div>

            <div class="os-content" id="os-routing">
                <div class="cmd-group">
                    <span class="cmd-label">1. Route Registrations (routes/route.abi)</span>
                    <pre><code>include("controller/controller.abi")

route("get", "/", "controller@index", "home")</code></pre>
                </div>
                <div class="cmd-group">
                    <span class="cmd-label">2. Returning Views with the <code>view()</code> Method</span>
                    <p class="cmd-desc" style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">Use the built-in <code>view("filename")</code> helper inside your controller actions. The view parser resolves filenames to <code>view/filename.ui</code> automatically, so you don't have to specify folders or file extensions.</p>
                </div>
            </div>
        </div>
    </div>
</section>
@include("view/layout/footer.ui")
EOF

cat << 'EOF' > server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Interpreter, BuiltinFunction } = require('./dist/interpreter');
const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');

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

const routes = [];
const mimeTypes = {
    '.html': 'text/html',
    '.ui': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

function renderTemplate(filePath) {
    if (!fs.existsSync(filePath)) {
        return `<!-- Template Error: File not found: ${filePath} -->`;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
    content = content.replace(includeRegex, (match, subPath) => {
        let includePath = path.resolve(__dirname, subPath);
        if (!fs.existsSync(includePath)) {
            includePath = path.resolve(path.dirname(filePath), subPath);
        }
        return renderTemplate(includePath);
    });

    const pluginRegex = /@plugin\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?(?:,\s*(.+?))?\)/g;
    content = content.replace(pluginRegex, (match, moduleName, funcName, argsStr) => {
        try {
            const plugin = require(moduleName);
            if (funcName) {
                const func = plugin[funcName];
                if (typeof func === 'function') {
                    let args = [];
                    if (argsStr) {
                        args = eval(`[${argsStr}]`);
                    }
                    return func(...args);
                }
                return plugin[funcName] || '';
            }
            if (typeof plugin === 'function') {
                return plugin();
            }
            return String(plugin);
        } catch (err) {
            return `<!-- Plugin Error (${moduleName}): ${err.message} -->`;
        }
    });

    const codeRegex = /<%([\s\S]*?)%>/g;
    let index = 0;
    let script = 'const __parts = [];\n';
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
        script += `__parts.push(${JSON.stringify(content.slice(index, match.index))});\n`;
        const code = match[1].trim();
        if (code.startsWith('=')) {
            script += `__parts.push(${code.slice(1)});\n`;
        } else {
            script += `${code}\n`;
        }
        index = codeRegex.lastIndex;
    }
    script += `__parts.push(${JSON.stringify(content.slice(index))});\n`;
    script += `return __parts.join("");\n`;
    
    try {
        const renderFunc = new Function('require', 'console', script);
        return renderFunc(require, console);
    } catch (err) {
        return `<!-- Template Script Error: ${err.message} -->\n${content}`;
    }
}

class ServerIO {
    print(msg) {
        console.log(msg);
    }
    async input(prompt) { return ""; }
}

async function startServer() {
    const io = new ServerIO();
    const interpreter = new Interpreter(io);

    interpreter.globals.define("include", new BuiltinFunction(1, async (args) => {
        const filePath = String(args[0]);
        const absolutePath = path.resolve(filePath);
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

    interpreter.globals.define("view", new BuiltinFunction(1, async (args) => {
        const pathName = String(args[0]);
        const cleanPath = pathName.startsWith("view/") ? pathName : "view/" + pathName;
        return cleanPath.endsWith(".ui") ? cleanPath : cleanPath + ".ui";
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

    const routeFile = path.resolve('routes/route.abi');
    if (fs.existsSync(routeFile)) {
        const source = fs.readFileSync(routeFile, 'utf8');
        const lexer = new Lexer(source);
        const parser = new Parser(lexer.tokenize());
        await interpreter.interpret(parser.parse());
    }

    const server = http.createServer(async (req, res) => {
        const urlPath = req.url.split('?')[0];
        
        if (urlPath.startsWith('/assets/')) {
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
            const actionName = route.action.split('@')[1];
            const controllerFunc = interpreter.globals.get(actionName);
            if (controllerFunc && typeof controllerFunc.call === 'function') {
                let viewFile = await controllerFunc.call(interpreter, []);
                if (viewFile && typeof viewFile === 'string') {
                    if (!viewFile.startsWith('view/')) {
                        viewFile = 'view/' + viewFile;
                    }
                    const filePath = path.join(__dirname, viewFile);
                    if (fs.existsSync(filePath)) {
                        const content = renderTemplate(filePath);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                    return;
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
        console.log(`Server running at http://127.0.0.1:${port}/`);
    });
    server.listen(port, '127.0.0.1');
}

startServer().catch(err => {
    console.error(err);
    process.exit(1);
});
EOF

# 7. Create routing and helper/constant components
cat << 'EOF' > controller/controller.abi
include("model/model.abi")

func index() {
    return view("index")
}

func docs() {
    return view("docs")
}
EOF

cat << 'EOF' > model/model.abi
func data() {
    return "Model data"
}
EOF

cat << 'EOF' > helpers/helpers.abi
func get_platform_info() {
    return "Running AbiLang " + VERSION + " by " + AUTHOR
}
EOF

cat << 'EOF' > constants/constants.abi
APP_TITLE = "AbiLang Bootstrap Portal"
VERSION = "1.2.0"
AUTHOR = "Abinash"
EOF

cat << 'EOF' > routes/route.abi
include("constants/constants.abi")

include("helpers/helpers.abi")

include("controller/controller.abi")

route("get", "/", "controller@index", "home")

route("get", "/docs", "controller@docs", "docs")
EOF

# 8. Download or copy design assets (CSS, JS, layout etc.)
if [ -d "$SCRIPT_DIR/web" ]; then
    cp "$SCRIPT_DIR/web/app.js" assets/js/app.js
    cp "$SCRIPT_DIR/web/style.css" assets/css/style.css
    cp "$SCRIPT_DIR/web/theme.css" assets/css/theme.css
    if [ -f "$SCRIPT_DIR/web/dist/abilang.min.js" ]; then
        cp "$SCRIPT_DIR/web/dist/abilang.min.js" assets/js/abilang.min.js
    else
        curl -fsSL "$BASE_URL/web/dist/abilang.min.js" -o assets/js/abilang.min.js
    fi
else
    curl -fsSL "$BASE_URL/web/app.js" -o assets/js/app.js
    curl -fsSL "$BASE_URL/web/style.css" -o assets/css/style.css
    curl -fsSL "$BASE_URL/web/theme.css" -o assets/css/theme.css
    curl -fsSL "$BASE_URL/web/dist/abilang.min.js" -o assets/js/abilang.min.js
fi

# 9. Configure global executables
echo '#!/usr/bin/env node' | cat - dist/cli.js > temp && mv temp dist/cli.js
chmod +x dist/cli.js

# Modify interpreter.js components to include standard route/include registration
node -e '
const fs = require("fs");
let content = fs.readFileSync("dist/interpreter.js", "utf8");
if (!content.includes("globals.define(\"include\"")) {
    content = content.replace("this.globals.define(\"render_ui\", new BuiltinFunction(1, async (args) => {\n            const uiElement = args[0];\n            if (this.io && \"renderUI\" in this.io && typeof this.io.renderUI === \"function\") {\n                await this.io.renderUI(uiElement);\n            }\n            else {\n                this.io.print(`[UI Render Log] ${JSON.stringify(uiElement, null, 2)}\\n`);\n            }\n            return null;\n        }));\n    }", `this.globals.define("render_ui", new BuiltinFunction(1, async (args) => {
            const uiElement = args[0];
            if (this.io && "renderUI" in this.io && typeof this.io.renderUI === "function") {
                await this.io.renderUI(uiElement);
            }
            else {
                this.io.print(\`[UI Render Log] \${JSON.stringify(uiElement, null, 2)}\\n\`);
            }
            return null;
        }));
        this.globals.define("include", new BuiltinFunction(1, async (args) => {
            const filePath = String(args[0]);
            const fs = require("fs");
            const path = require("path");
            const absolutePath = path.resolve(filePath);
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
        this.globals.define("view", new BuiltinFunction(1, async (args) => {
            const pathName = String(args[0]);
            const cleanPath = pathName.startsWith("view/") ? pathName : "view/" + pathName;
            return cleanPath.endsWith(".ui") ? cleanPath : cleanPath + ".ui";
        }));
        this.globals.define("route", new BuiltinFunction(4, async (args) => {
            const method = String(args[0]);
            const path = String(args[1]);
            const action = String(args[2]);
            const name = String(args[3]);
            this.io.print(\`[Route Registered] \${method.toUpperCase()} \${path} -> \${action} (\${name})\\n\`);
            if (path === "/") {
                const parts = action.split("@");
                const actionName = parts[1];
                const controllerFunc = this.globals.get(actionName);
                if (controllerFunc && typeof controllerFunc.call === "function") {
                    const result = await controllerFunc.call(this, []);
                    this.io.print(\`[Route Executed] Result: \${result}\\n\`);
                } else {
                    this.io.print(\`[Route Error] Action \\\x27\${actionName}\\\x27 not found in global scope.\\n\`);
                }
            }
            return null;
        }));
    }`);
    fs.writeFileSync("dist/interpreter.js", content, "utf8");
}
'

# Patch app.js: 
# Ensure regular expression syntax error is fixed if present
node -e '
const fs = require("fs");
let appJs = fs.readFileSync("assets/js/app.js", "utf8");
if (appJs.includes("(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\(()")) {
    appJs = appJs.replace("(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\(()", "(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?=\\s*\\())");
    fs.writeFileSync("assets/js/app.js", appJs, "utf8");
}
'

# Mini-minify styling files
node -e '
const fs = require("fs");
["style.css", "theme.css"].forEach(file => {
    let path = "assets/css/" + file;
    if (fs.existsSync(path)) {
        let code = fs.readFileSync(path, "utf8");
        code = code.replace(/\/\*[\s\S]*?\*\//g, "");
        fs.writeFileSync(path, code, "utf8");
    }
});
'

# Complete dependency link
npm install --omit=dev
npm link --force

echo ""
echo "============================================="
echo "AbiLang Project successfully created!"
echo "Project Path: $(pwd)"
echo "To start the web server, run:"
echo "  npm run web"
echo "============================================="
