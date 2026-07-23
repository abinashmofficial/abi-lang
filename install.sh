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
echo "│               Installer v1.0                │"
echo "│                                              │"
echo "└──────────────────────────────────────────────┘"
echo ""

if [ -t 0 ]; then
    TTY_IN=/dev/stdin
else
    TTY_IN=/dev/tty
fi

if [ -z "$PROJECT_NAME" ]; then
    read -r -p "Enter project name [abilang]: " PROJECT_NAME_INPUT <"$TTY_IN"
    PROJECT_NAME="${PROJECT_NAME_INPUT:-abilang}"
fi

if [ -z "$PORT" ]; then
    read -r -p "Enter port number [3000]: " PORT_INPUT <"$TTY_IN"
    PORT="${PORT_INPUT:-3000}"
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

{
    echo "PORT=$PORT"
    echo "APP_NAME=$APP_NAME"
    echo "APP_LANG=en"
    echo "DB_DRIVER=$DB_DRIVER"
    echo "DB_HOST=127.0.0.1"
    echo "DB_PORT=$DB_DEFAULT_PORT"
    echo "DB_DATABASE=$DB_DATABASE"
    echo "DB_USERNAME=$DB_USERNAME"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "API_KEY=$API_KEY"
} > .env

echo ".env file created successfully!"

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
    "web": "node server.js",
    "reload": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "bootstrap": "^5.3.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "esbuild": "^0.19.11"
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

cat << 'EOF' > abicore/screens/layout/header.abx
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
            <a class="navbar-brand d-flex align-items-center" href="/">
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
<script prepare>
    const name = context.profileName || "Guest User";
    const role = context.profileRole || "Viewer";
</script>

<div class="card card-custom p-4 text-start mx-auto mb-4" style="max-width: 600px; border-left: 4px solid var(--abi-green);">
    <h5 class="text-white mb-2">{{ name }}</h5>
    <p class="text-muted mb-0">Role: <span class="text-white-50">{{ role }}</span></p>
</div>
EOF

cat << 'EOF' > abicore/screens/components/landing_body.abx
render ProfileCard from "components/profile_card"

<script prepare>
    const os = require('os');
</script>

<section class="hero-section d-flex align-items-center">
    <div class="container">
        <div class="row align-items-center justify-content-center">
            <div class="col-lg-9 text-center">
                <div class="badge bg-secondary bg-opacity-25 text-light mb-3 px-3 py-2 border border-secondary border-opacity-50">
                    AbiLang v1.2.0 (Bootstrap Cloud Release)
                </div>
                <h1 class="display-3 fw-bold mb-4 text-white">
                    {{ lang.title }}
                </h1>
                <p class="lead text-muted mb-5 fs-5">
                    {{ lang.subtitle }}
                </p>
                <div class="d-flex justify-content-center gap-3 mb-5">
                    <button class="btn btn-gradient btn-lg px-4" id="launch-btn">{{ lang.get_started }}</button>
                    <a class="btn btn-outline-secondary btn-lg px-4" href="https://github.com/abinashmofficial/abi-lang" target="_blank">{{ lang.view_docs }}</a>
                </div>
                <div class="mb-4">
                    <ProfileCard />
                </div>
                <div class="card card-custom p-4 text-start mx-auto" style="max-width: 600px;">
                    <h5 class="text-white mb-3">{{ lang.system_info }}</h5>
                    <div class="row text-muted fs-6">
                        <div class="col-6 mb-2"><strong>{{ lang.platform }}:</strong> {{ os.platform() }}</div>
                        <div class="col-6 mb-2"><strong>{{ lang.architecture }}:</strong> {{ os.arch() }}</div>
                        <div class="col-6 mb-2"><strong>{{ lang.uptime }}:</strong> {{ Math.floor(os.uptime()) }} {{ lang.seconds }}</div>
                        <div class="col-6 mb-2"><strong>{{ lang.memory }}:</strong> {{ Math.floor(os.freemem() / 1024 / 1024) }}MB / {{ Math.floor(os.totalmem() / 1024 / 1024) }}MB</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
EOF

cat << 'EOF' > abicore/screens/index.abx
render Header from "layout/header"
render LandingBody from "components/landing_body"
render Footer from "layout/footer"

<script prepare>
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    let lang = {};
    try {
        const langCode = process.env.APP_LANG || 'en';
        const langFile = path.resolve('abicore/lang/' + langCode + '/messages.json');
        if (fs.existsSync(langFile)) {
            lang = JSON.parse(fs.readFileSync(langFile, 'utf8'));
        } else {
            lang = JSON.parse(fs.readFileSync(path.resolve('abicore/lang/en/messages.json'), 'utf8'));
        }
    } catch (e) {
        lang = { title: "AbiLang", subtitle: "Welcome" };
    }
    context.lang = lang;
    context.profileName = "Abinash";
    context.profileRole = "Lead Platform Architect";
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

    .text-white { color: var(--text-main) !important; }
    .text-light { color: var(--text-main) !important; }
    .text-muted { color: var(--text-muted) !important; }
    .text-white-50 { color: var(--text-muted) !important; }
    strong { color: var(--text-main); }

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


cat << 'EOF' > abicore/screens/docx.abx

<div class="docs-layout">
    <aside id="docs-sidebar" class="docs-sidebar">
        <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" class="search-input" placeholder="Search documentation..." autocomplete="off">
        </div>

        <div class="nav-group">
            <div class="nav-group-title">Getting Started</div>
            <ul class="nav-group-list">
                <li class="nav-item"><a href="#introduction" class="nav-link active">Introduction</a></li>
                <li class="nav-item"><a href="#structure" class="nav-link">Language Structure & Use</a></li>
                <li class="nav-item"><a href="#installation" class="nav-link">Installation & CLI</a></li>
                <li class="nav-item"><a href="#ide-integration" class="nav-link">IDE Syntax & Extensions</a></li>
            </ul>
        </div>

        <div class="nav-group">
            <div class="nav-group-title">Language Syntax</div>
            <ul class="nav-group-list">
                <li class="nav-item"><a href="#variables" class="nav-link">Variables</a></li>
                <li class="nav-item"><a href="#conditionals" class="nav-link">Conditionals</a></li>
                <li class="nav-item"><a href="#loops" class="nav-link">Loops</a></li>
                <li class="nav-item"><a href="#functions" class="nav-link">Functions</a></li>
            </ul>
        </div>

        <div class="nav-group">
            <div class="nav-group-title">Architecture</div>
            <ul class="nav-group-list">
                <li class="nav-item"><a href="#handlers" class="nav-link">Handlers & Entities</a></li>
                <li class="nav-item"><a href="#navigation" class="nav-link">Navigation & Screens</a></li>
                <li class="nav-item"><a href="#ui-template" class="nav-link">Component & View Syntax</a></li>
                <li class="nav-item"><a href="#step-by-step-guide" class="nav-link">Step-by-Step MVC Setup</a></li>
            </ul>
        </div>

        <div class="nav-group">
            <div class="nav-group-title">Comparison</div>
            <ul class="nav-group-list">
                <li class="nav-item"><a href="#comparison-table-sec" class="nav-link">Comparison Table</a></li>
            </ul>
        </div>
    </aside>

    <main class="docs-main">
        <section id="introduction" class="docs-section">
            <h1>Introduction</h1>
            <p><strong>AbiLang</strong> is a progressive, lightweight, and versatile scripting language named after you (<strong>Abinash</strong>). Built from scratch using TypeScript, it runs natively on both backend environments via CLI terminal engines and in web browsers through an interactive sandboxed playground.</p>
            
            <div class="callout callout-info">
                <strong>Core Philosophy:</strong> AbiLang is designed to minimize boilerplates, eliminate unnecessary tokens like declarations (<code>const</code>, <code>let</code>) and mandatory semicolons, and introduce robust structural clarity with clean braces and optional parameter parentheses.
            </div>

            <h2>Key Features</h2>
            <ul>
                <li><strong>No Declarations:</strong> Assign variables directly. The interpreter handles allocations dynamically.</li>
                <li><strong>Flexible Flow Control:</strong> Clean loop iterations and conditional checks with optional parentheses.</li>
                <li><strong>Integrated Framework Mechanics:</strong> Native handler configurations, entity definitions, route bindings, and screen render engine helpers.</li>
                <li><strong>Cloud Ready:</strong> Native cloud integrations featuring asynchronous <code>fetch</code> routines and <code>json_parse</code> parsing out of the box.</li>
            </ul>
        </section>

        <section id="structure" class="docs-section">
            <h1>Language Structure & Use</h1>
            <p>AbiLang is designed around a three-tier architecture that tokenizes, parses, and executes code trees natively in safe environment contexts. Understanding its structure helps in leveraging its features for rapid scripting, backend logic orchestration, and lightweight browser playground views.</p>
            
            <h2>1. Framework Engine Architecture</h2>
            <p>The compiler and runner pipelines are divided into three core stages:</p>
            <ul>
                <li><strong>Lexical Analyzer (Lexer)</strong>: Converts raw script characters into structured language tokens (keywords, literals, operations).</li>
                <li><strong>Syntax Analyzer (Parser)</strong>: Arranges tokens into an Abstract Syntax Tree (AST) using recursive descent parsing. It enforces constraints on expressions and statements.</li>
                <li><strong>Evaluation Tree (Interpreter)</strong>: Evaluates AST nodes recursively, utilizing isolated lexical environments to execute instructions in real time.</li>
            </ul>

            <h2>2. What Makes AbiLang Different?</h2>
            <p>Unlike standard languages (like JavaScript or PHP), AbiLang introduces a streamlined development experience:</p>
            <ul>
                <li><strong>No Boilerplate Declarations</strong>: Variables are dynamically initialized on first assignment. No extra lexical keywords needed.</li>
                <li><strong>Native App Architecture</strong>: Built-in classes for logical Handlers and Entities, dynamic routes registration, and automatic Screens resolution.</li>
                <li><strong>Robust Variable Inspector</strong>: Dynamic inspection using the Laravel-like <code>dd()</code> helper without crashing the active environment.</li>
                <li><strong>Cross-Platform Portability</strong>: Designed to run identically inside terminal shells (using Node) and inside sandboxed web frames (using HTML5/JS).</li>
            </ul>

            <h2>3. Use Cases & Applications</h2>
            <p>AbiLang is ideal for building dynamic, multi-platform applications, including:</p>
            <ul>
                <li><strong>Backend Tasks & Helpers</strong>: Automate database migrations, connect to third-party endpoints, or run scheduled background scripts.</li>
                <li><strong>Web Portals & Endpoints</strong>: Register navigation path schemas to resolve handlers and screen layouts with active templating.</li>
                <li><strong>Lightweight UI Components</strong>: Embed screens dynamically inside web layouts using clean layout includes and esbuild transformation hooks.</li>
            </ul>
        </section>

        <section id="installation" class="docs-section">
            <h1>Installation & CLI</h1>
            <p>Run the AbiLang compiler CLI and local web playground directly on your machine. Choose the appropriate installer command for your environment below.</p>
            
            <h2>macOS & Linux Setup</h2>
            <p>To run the single-click remote automated installation script, copy the command below:</p>
            <pre><code class="language-bash">curl -fsSL https://raw.githubusercontent.com/abinashmofficial/abi-lang/main/install.sh | bash</code></pre>

            <h2>Manual Compilation & Local Run</h2>
            <p>If you prefer a manual setup, clone the repository, install its packages, and boot up the visual playground:</p>
            <pre><code class="language-bash"># 1. Clone repository
git clone https://github.com/abinashmofficial/abi-lang.git
cd abi-lang

# 2. Install TypeScript development tooling
npm install

# 3. Build compiler engine binaries
npm run build

# 4. Spin up local interactive web playground
npm run web</code></pre>
        </section>

        <section id="ide-integration" class="docs-section">
            <h1>IDE Syntax & Extensions</h1>
            <p>AbiLang provides official syntax highlighting and file extension configurations for popular IDEs (VS Code, VS Code Insiders, Vim, and Sublime Text). This ensures developers get a seamless editing experience with zero error flags.</p>
            
            <h2>Supported File Extensions</h2>
            <p>You can write and execute AbiLang script files and templates using any of these standard extensions:</p>
            <ul>
                <li><code>.abi</code> - Standard default extension</li>
                <li><code>.ab</code> - Short unique extension</li>
                <li><code>.abilang</code> - Explicit verbose extension</li>
                <li><code>.abx</code> - Component template and layouts extension</li>
            </ul>

            <h2>Laravel/PHP Style Highlights</h2>
            <p>Classes, methods, and visibility scopes (<code>public</code>, <code>private</code>, <code>protected</code>) are configured to match standard Laravel PHP color profiles, highlighting classes and function namespaces dynamically. This works natively for <code>.abi</code> files and <code>.abx</code> templates without requiring opening <code>&lt;?php</code> tags.</p>
            
            <h2>Auto-Installer Script</h2>
            <p>To register the file type associations and coloring configurations globally for all editors on your machine (including VS Code and VS Code Insiders), run:</p>
            <pre><code class="language-bash">node scripts/install-syntax.js</code></pre>
        </section>

        <section id="variables" class="docs-section">
            <h1>Variables</h1>
            <p>Variables in AbiLang store data dynamically. You do not need keywords like <code>var</code>, <code>let</code>, or <code>const</code>, and semicolons are completely optional.</p>
            
            <pre><code>name = "Abinash"
age = 21
pi = 3.14159
print "Name: " + name</code></pre>

            <div class="callout callout-tip">
                <strong>Tip:</strong> Dynamic typing ensures variables can change their underlying representation on successive operations automatically.
            </div>
        </section>

        <section id="conditionals" class="docs-section">
            <h1>Conditionals</h1>
            <p>Conditionals allow branching execution. AbiLang utilizes modern block scoping via braces <code>{}</code> while making parentheses around expressions optional.</p>

            <pre><code>score = 85
if score >= 90 {
    print "Grade A"
} else if score >= 80 {
    print "Grade B"
} else {
    print "Grade F"
}</code></pre>
        </section>

        <section id="loops" class="docs-section">
            <h1>Loops</h1>
            <p>Iterate over code ranges efficiently. AbiLang supports standard <code>while</code> loops and native array iterations without parenthesis boilerplates.</p>

            <pre><code>count = 1
while count <= 3 {
    print "Count: " + count
    count = count + 1
}</code></pre>
        </section>

        <section id="functions" class="docs-section">
            <h1>Functions</h1>
            <p>Functions isolate modular calculations. AbiLang uses the <code>func</code> keyword to declare reusable code blocks that accept arguments and return evaluations.</p>

            <pre><code>func greet(name) {
    return "Hello, " + name + "!"
}
message = greet("Abinash")
print message</code></pre>
        </section>

        <section id="handlers" class="docs-section">
            <h1>Handlers & Entities</h1>
            <p>AbiLang utilizes Object-Oriented Programming (OOP) paradigms by leveraging the dynamic nature of dictionary literals and lexical closures. Since AbiLang focuses on a clean syntax without boilerplate class decorators, objects are instantiated using Factory Constructor Patterns.</p>
            
            <div class="callout callout-tip">
                <strong>OOP Architecture in AbiLang:</strong>
                <ul>
                    <li><strong>Objects:</strong> Created as dynamic dictionaries (<code>{}</code>) containing both attributes and member functions.</li>
                    <li><strong>Encapsulation:</strong> Private fields can be initialized in constructor scopes; inner functions capture these states in their closures.</li>
                    <li><strong>Inheritance:</strong> Accomplished by initializing parent object dictionaries and merging/extending them with new attributes or overridden functions.</li>
                </ul>
            </div>

            <h2>Defining OOP Entities</h2>
            <p>In AbiLang, entities represent database models and domain objects. You can structure them as constructor classes using factory functions:</p>
            
            <pre><code># Factory constructor for UserEntity
func UserEntity(id, name, email) {
    self = {}
    self.id = id
    self.name = name
    self.email = email

    func get_info() {
        return "User: " + self.name + " (" + self.email + ")"
    }
    self.get_info = get_info

    func update_email(new_email) {
        self.email = new_email
        return self
    }
    self.update_email = update_email

    return self
}</code></pre>

            <p>To use this entity in your application:</p>
            <pre><code>include("entities/user_entity.abi")

user1 = UserEntity(1, "Abinash", "abinash@example.com")
print user1.get_info()
user1.update_email("abinash.official@example.com")
print user1.get_info()</code></pre>

            <h2>Handler Classes & OOP Inheritance</h2>
            <p>Handlers manage application logic, coordinating between entities and screens. You can implement handler classes that inherit behavior from other classes using the extends keyword:</p>
            
            <pre><code># file: abicore/handlers/base_handler.abi
class BaseHandler {
    public func init(name) {
        this.name = name
    }

    public func log_access() {
        print "Access logged for: " + this.name
    }
}</code></pre>

            <p>Then, extend the base class to inherit methods and properties:</p>
            
            <pre><code># file: abicore/handlers/handler.abi
include("handlers/base_handler.abi")
include("entities/entity.abi")

class Handler extends BaseHandler {
    public func index() {
        this.log_access()
        e = Entity()
        print "Calling entity: " + e.data()
        return screen("index")
    }

    public func docs() {
        return screen("docx")
    }
}</code></pre>

            <h2>Try / Catch / Finally</h2>
            <p>AbiLang provides try-catch-finally block structures to safely capture and handle execution and syntax/runtime errors:</p>
            <pre><code>try {
    print undefined_var
} catch (e) {
    print "An error occurred: " + e
} finally {
    print "Clean execution finished"
}</code></pre>

            <h2>Built-in Database & Debugging Helpers</h2>
            <p>Perform database connections, mutations, queries, and Laravel-like formatted variable dumping:</p>
            <pre><code>conn = db_connect({ "host": "localhost", "port": 3306 })
record = db_create("users", { "username": "Abinash", "email": "abinash@example.com" })
records = db_fetch("users", { "status": "active" })
dd(record)</code></pre>
        </section>

        <section id="navigation" class="docs-section">
            <h1>Navigation & Screens</h1>
            <p>AbiLang features standard routing structures built into the language engine, allowing you to define route schemas that map directly to handler actions.</p>
            
            <h3>Route Registration</h3>
            <p>Register routes using the native <code>route</code> statement, specifying HTTP verb, endpoint, target handler action, and route alias:</p>
            <pre><code># file: abicore/navigation/routes.abi
include("handlers/handler.abi")

route("get", "/profile", "handler@show_profile", "user.profile")</code></pre>

            <h3>Returning Screens</h3>
            <p>The built-in <code>screen("filename")</code> helper automatically loads and processes the corresponding user interface definition from the screens layout space:</p>
            <pre><code># file: abicore/handlers/handler.abi
class Handler {
    public func index() {
        return screen("index")
    }
}</code></pre>
        </section>

        <section id="ui-template" class="docs-section">
            <h1>Component & View Syntax</h1>
            <p>AbiLang uses <code>.abx</code> files as its screen/view layer — similar to <code>.jsx</code> or <code>.tsx</code> in React. Every <code>.abx</code> file is a server-side template that renders to plain HTML. AbiLang introduces its own clean keywords so the syntax feels natural and easy to read.</p>

            <div class="callout callout-info">
                <strong>Philosophy:</strong> The <code>.abx</code> template syntax is designed to look like React/JSX — without any of the JavaScript build tooling complexity. Write HTML, add logic, compose screens — that's it.
            </div>

            <h2>1. <code>render</code> — Include a Screen or Component</h2>
            <p>The <code>render</code> keyword pulls another <code>.abx</code> file into the current screen, exactly where the statement appears. This makes rendering UI components feel extremely natural and explicit.</p>

            <pre><code>re&#110;der Header from "layout/header"
re&#110;der Docx   from "docx"
re&#110;der Footer from "layout/footer"</code></pre>

            <h2>2. Reusable Layouts & Components</h2>
            <p>In AbiLang, child layouts and reusable templates are simply plain <code>.abx</code> files. You do not need any special headers or keywords at the top of the file. The rendering context is automatically scoped to the component (via <code>with(context)</code>), meaning properties can be outputted directly using <code>{&#123; variableName }}</code> instead of <code>{&#123; context.variableName }}</code>.</p>

            <p>For example, a sub-screen component:</p>
            <pre><code># file: abicore/screens/docx.abx
&lt;section class="docs-section"&gt;
    &lt;h2&gt;Documentation V1&lt;/h2&gt;
    &lt;p&gt;AbiLang reference material...&lt;/p&gt;
&lt;/section&gt;</code></pre>

            <p>Then render it inside another screen:</p>
            <pre><code># file: abicore/screens/docs.abx
re&#110;der Header from "layout/header"
re&#110;der Docx   from "docx"
re&#110;der Footer from "layout/footer"

&lt;Header /&gt;
&lt;Docx /&gt;
&lt;Footer /&gt;</code></pre>

            <h2>3. <code>&lt;script prepare&gt;</code> — Logic Block</h2>
            <p>Wrap server-side JavaScript logic inside a <code>&lt;script prepare&gt;&lt;/script&gt;</code> block. This runs before the HTML is rendered. Use it to load language files, read environment variables, or prepare data for the template.</p>

            <pre><code>&lt;script prepare&gt;
    const fs   = require('fs');
    const path = require('path');
    const os   = require('os');

    let lang = {};
    try {
        const file = path.resolve('abicore/lang/en/messages.json');
        lang = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        lang = { title: "AbiLang", subtitle: "Welcome" };
    }
&lt;/script&gt;</code></pre>

            <h2>4. <code>{{ }}</code> — Inline Expression Output</h2>
            <p>Use double curly braces to output any JavaScript expression directly into the HTML. This replaces the old <code>&lt;%= expr %&gt;</code> syntax.</p>

            <pre><code>&lt;h1&gt;{&#123; lang.title }}&lt;/h1&gt;
&lt;p&gt;{&#123; lang.subtitle }}&lt;/p&gt;
 
&lt;div&gt;
    &lt;strong&gt;Platform:&lt;/strong&gt;  {&#123; os.platform() }}
    &lt;strong&gt;Memory:&lt;/strong&gt;   {&#123; Math.floor(os.freemem() / 1024 / 1024) }}MB
    &lt;strong&gt;Uptime:&lt;/strong&gt;   {&#123; Math.floor(os.uptime()) }}s
&lt;/div&gt;</code></pre>

            <h2>5. Complete Screen Example</h2>
            <p>Here is a full <code>abicore/screens/index.abx</code> showing all four features working together:</p>

            <pre><code>re&#110;der Header from "layout/header"
re&#110;der Footer from "layout/footer"

&lt;script prepare&gt;
    const fs   = require('fs');
    const path = require('path');
    const os   = require('os');
    let lang = {};
    try {
        lang = JSON.parse(fs.readFileSync(path.resolve('abicore/lang/en/messages.json'), 'utf8'));
    } catch (e) {
        lang = { title: "AbiLang", subtitle: "Welcome" };
    }
&lt;/script&gt;

&lt;Header /&gt;

&lt;section class="hero-section"&gt;
    &lt;h1&gt;{&#123; lang.title }}&lt;/h1&gt;
    &lt;p&gt;{&#123; lang.subtitle }}&lt;/p&gt;
    &lt;div&gt;
        Platform: {&#123; os.platform() }} |
        Memory:   {&#123; Math.floor(os.freemem() / 1024 / 1024) }}MB
    &lt;/div&gt;
&lt;/section&gt;

&lt;Footer /&gt;</code></pre>

            <h2>6. Keyword Reference</h2>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>AbiLang Keyword</th>
                        <th>What it Does</th>
                        <th>React / JSX Equivalent</th>
                        <th>Old Syntax (EJS)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="strong"><code>render X from "path"</code></td>
                        <td>Include another .abx file inline</td>
                        <td class="check-yes"><code>render X from "./X"</code> + <code>&lt;X /&gt;</code></td>
                        <td><code>&#64;include("path")</code></td>
                    </tr>
                    <tr>
                        <td class="strong"><code>&lt;script prepare&gt;...&lt;/script&gt;</code></td>
                        <td>Server-side logic / data preparation</td>
                        <td class="check-yes"><code>&lt;script prepare&gt;</code> (Unique)</td>
                        <td><code>&lt;% code %&gt;</code></td>
                    </tr>
                    <tr>
                        <td class="strong"><code>{&#123; expression }}</code></td>
                        <td>Output a value into HTML</td>
                        <td class="check-yes"><code>{expression}</code> in JSX</td>
                        <td><code>&lt;%= expression %&gt;</code></td>
                    </tr>
                </tbody>
            </table>

            <h2>7. Sharing Data & Exports (Context & Props)</h2>
            <p>AbiLang templates share a dynamic <code>context</code> object between parent screens and child layout templates. This allows you to pass data (props) down to layouts, or export data up from components.</p>
            
            <h3>Passing Data Down (Props)</h3>
            <p>Assign any variable to the <code>context</code> object inside the parent screen's logic block:</p>
            <pre><code># file: abicore/screens/index.abx
&lt;script prepare&gt;
    context.pageTitle = "Home Dashboard";
    context.user = { name: "Abinash", role: "Admin" };
&lt;/script&gt;

re&#110;der Header from "layout/header"</code></pre>

            <p>Then read and output the variables inside the child component/layout template:</p>
            <pre><code># file: abicore/screens/layout/header.abx
&lt;header&gt;
    &lt;h1&gt;{&#123; context.pageTitle }}&lt;/h1&gt;
    &lt;span&gt;Logged in as: {&#123; context.user.name }}&lt;/span&gt;
&lt;/header&gt;</code></pre>

            <h3>Exporting Data Up from Components</h3>
            <p>If a reusable component prepares data or configuration, it can write directly to the shared <code>context</code> object to export it to the parent screen:</p>
            <pre><code># file: abicore/screens/layout/sidebar.abx
&lt;script prepare&gt;
    # Export variable to parent template
    context.sidebarLinks = ["Home", "Docs", "Settings"];
&lt;/script&gt;</code></pre>

            <p>The parent template can access the exported variables anywhere after rendering the component:</p>
            <pre><code># file: abicore/screens/index.abx
re&#110;der Sidebar from "layout/sidebar"

&lt;footer&gt;
    &lt;p&gt;Available Links: {&#123; context.sidebarLinks.join(', ') }}&lt;/p&gt;
&lt;/footer&gt;</code></pre>

            <h2>8. Reusing the Profile Component</h2>
            <p>Configure a component file, import/export its scope variables, and render it in multiple places with custom parameters.</p>
            
            <h3>1. Component View: <code>abicore/screens/components/profile_card.abx</code></h3>
            <pre><code>&lt;script prepare&gt;
    const os = require('os');
    const name = context.profileName || "Guest User";
    const role = context.profileRole || "Viewer";
    const platform = os.platform();
    const memory = Math.floor(os.freemem() / 1024 / 1024);
&lt;/script&gt;

&lt;div class="profile-card"&gt;
    &lt;h2&gt;User Profile&lt;/h2&gt;
    &lt;hr&gt;
    &lt;p&gt;&lt;strong&gt;Name:&lt;/strong&gt; {&#123; name }}&lt;/p&gt;
    &lt;p&gt;&lt;strong&gt;Role:&lt;/strong&gt; {&#123; role }}&lt;/p>
    
    &lt;div class="system-stats"&gt;
        &lt;h3&gt;System Details&lt;/h3&gt;
        &lt;ul&gt;
            &lt;li&gt;&lt;strong&gt;OS Platform:&lt;/strong&gt; {&#123; platform }}&lt;/li&gt;
            &lt;li&gt;&lt;strong&gt;Free Memory:&lt;/strong&gt; {&#123; memory }} MB&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/div&gt;
&lt;/div&gt;</code></pre>

            <h3>2. Reusing in Main Screen: <code>abicore/screens/dashboard.abx</code></h3>
            <pre><code>re&#110;der Header from "layout/header"
re&#110;der ProfileCard from "components/profile_card"
re&#110;der Footer from "layout/footer"

&lt;Header /&gt;

&lt;ProfileCard profileName="Abinash" profileRole="Administrator" /&gt;

&lt;ProfileCard profileName="Jane Doe" profileRole="Support Manager" /&gt;

&lt;Footer /&gt;</code></pre>
        </section>

        <section id="step-by-step-guide" class="docs-section">
            <h1>Step-by-Step MVC Setup</h1>
            <p>Configure a complete full-stack web application with handlers, entities, template views (using the unique <code>.abx</code> format), Node modules, and API mutators.</p>
            
            <h2>9. Master Layout Wrapper (Automatic Wrapping)</h2>
            <p>Instead of rendering header and footer layouts manually on every page, you can define a single global layout template at <code>abicore/screens/layout/layout.abx</code>. The framework automatically detects this file and wraps your page screens in it.</p>
            
            <h3>1. Master Layout: <code>abicore/screens/layout/layout.abx</code></h3>
            <p>Define the header, dynamic body view, and footer. Use the dynamic <code>context.viewPage</code> variable to render the targeted page view:</p>
            <pre><code>re&#110;der Header from "layout/header"
re&#110;der Body from context.viewPage
re&#110;der Footer from "layout/footer"

&lt;Header /&gt;
&lt;Body /&gt;
&lt;Footer /&gt;</code></pre>

            <h3>2. The Page View: <code>abicore/screens/dashboard.abx</code></h3>
            <p>Since the header and footer are wrapped automatically, your screen file only needs to contain the middle content and setup block:</p>
            <pre><code>&lt;script prepare&gt;
    context.pageTitle = "My Dashboard";
&lt;/script&gt;

&lt;div class="container"&gt;
    &lt;h1&gt;Dashboard Area&lt;/h1&gt;
    &lt;p&gt;This content is injected directly in the middle of the screen layout.&lt;/p&gt;
&lt;/div&gt;</code></pre>
            
            <h2>10. React-like Component Tag Rendering</h2>
            <p>To write cleaner, component-driven layouts, declare renders at the top of your page using the standard <code>render</code> statement, and then render them inline inside your markup using custom component tags.</p>
            
            <h3>Sample View Page: <code>abicore/screens/dashboard.abx</code></h3>
            <pre><code>re&#110;der ProfileCard from "components/profile_card"

&lt;script prepare&gt;
    context.profileName = "Abinash";
    context.profileRole = "Administrator";
&lt;/script&gt;

&lt;div class="container"&gt;
    &lt;ProfileCard /&gt;
&lt;/div&gt;</code></pre>
            
            <h2>11. Named Component Wrapping (Export Blocks)</h2>
            <p>You can optionally wrap your HTML templates inside an <code>e&#120;port ComponentName { ... }</code> block to define named layout structures explicitly:</p>
            
            <h3>Sample Component: <code>abicore/screens/components/profile_card.abx</code></h3>
            <pre><code>&lt;script prepare&gt;
    const os = require('os');
    export name = context.profileName || "Guest User";
    export role = context.profileRole || "Viewer";
    export platform = os.platform();
    export memory = Math.floor(os.freemem() / 1024 / 1024);
&lt;/script&gt;

e&#120;port ProfileCard {
    &lt;div class="profile-card"&gt;
        &lt;h2&gt;User Profile&lt;/h2&gt;
        &lt;hr&gt;
        &lt;p&gt;&lt;strong&gt;Name:&lt;/strong&gt; {&#123; name }}&lt;/p&gt;
        &lt;p&gt;&lt;strong&gt;Role:&lt;/strong&gt; {&#123; role }}&lt;/p>
        
        &lt;div class="system-stats"&gt;
            &lt;h3&gt;System Details&lt;/h3&gt;
            &lt;ul&gt;
                &lt;li&gt;&lt;strong&gt;OS Platform:&lt;/strong&gt; {&#123; platform }}&lt;/li&gt;
                &lt;li&gt;&lt;strong&gt;Free Memory:&lt;/strong&gt; {&#123; memory }} MB&lt;/li&gt;
            &lt;/ul&gt;
        &lt;/div&gt;
    &lt;/div&gt;
}</code></pre>
            
            <h2>Step 1: Scaffolding files</h2>
            <p>Create these directories in your workspace: <code>abicore/navigation/</code>, <code>abicore/handlers/</code>, <code>abicore/entities/</code>, <code>abicore/screens/</code>, <code>abicore/support/</code>, <code>abicore/constants/</code>.</p>
            <p>Your workspace directory tree will look like this:</p>
            <pre><code>my-project/
├── abicore/
│   ├── constants/
│   │   └── constants.abi
│   ├── entities/
│   │   └── entity.abi
│   ├── handlers/
│   │   └── handler.abi
│   ├── lang/
│   │   └── en/
│   │       └── messages.json
│   ├── navigation/
│   │   └── routes.abi
│   ├── screens/
│   │   ├── components/
│   │   ├── layout/
│   │   │   ├── footer.abx
│   │   │   ├── header.abx
│   │   │   └── layout.abx
│   │   ├── docs.abx
│   │   └── index.abx
│   └── support/
│       └── helpers.abi
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── theme.css
│   └── js/
│       ├── abilang.min.js
│       └── app.js
├── .env
├── package.json
└── server.js</code></pre>
            
            <h2>Step 2: Database Config</h2>
            <p>Use the built-in <code>env()</code> function to load database config settings directly from the <code>.env</code> file:</p>
            <pre><code># file: abicore/constants/constants.abi
APP_TITLE = env("APP_TITLE")
VERSION = env("APP_VERSION")
AUTHOR = env("APP_AUTHOR")

DB_HOST = env("DB_HOST")
DB_PORT = env("DB_PORT")
DB_DATABASE = env("DB_DATABASE")
DB_USERNAME = env("DB_USERNAME")
DB_PASSWORD = env("DB_PASSWORD")</code></pre>
            
            <h2>Step 3: Database Entity Model</h2>
            <pre><code># file: abicore/entities/entity.abi
func Entity() {
    self = {}
    self.data = func() {
        return "AbiLang Database Service Core Loaded"
    }
    return self
}</code></pre>
            
            <h2>Step 4: Request Handler Controller</h2>
            <p>Defines request handlers as controller classes and utilizes database constants:</p>
            <pre><code># file: abicore/handlers/handler.abi
include("entities/entity.abi")

class Handler {
    public func index() {
        e = Entity()
        print "Calling entity: " + e.data()
        print "Database Config -> Host: " + DB_HOST + ", DB: " + DB_DATABASE
        return screen("index")
    }

    public func docs() {
        return screen("docx")
    }
}</code></pre>
            
            <h2>Step 5: Route Registrations</h2>
            <pre><code># file: abicore/navigation/routes.abi
include("constants/constants.abi")
include("support/helpers.abi")
include("handlers/handler.abi")

route("get", "/", "handler@index", "home")
route("get", "/docs", "handler@docs", "docs")</code></pre>
            
            <h2>Step 6: Frontend View Screens & Components (.abx)</h2>
            
            <h3>1. Main Entry screen: <code>abicore/screens/index.abx</code></h3>
            <pre><code>re&#110;der Header from "layout/header"
re&#110;der LandingBody from "components/landing_body"
re&#110;der Footer from "layout/footer"

&lt;script prepare&gt;
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    let lang = {};
    try {
        const langCode = process.env.APP_LANG || 'en';
        const langFile = path.resolve('abicore/lang/' + langCode + '/messages.json');
        if (fs.existsSync(langFile)) {
            lang = JSON.parse(fs.readFileSync(langFile, 'utf8'));
        } else {
            lang = JSON.parse(fs.readFileSync(path.resolve('abicore/lang/en/messages.json'), 'utf8'));
        }
    } catch (e) {
        lang = { title: "AbiLang", subtitle: "Welcome" };
    }
    context.lang = lang;
    context.profileName = "Abinash";
    context.profileRole = "Lead Platform Architect";
&lt;/script&gt;

&lt;Header /&gt;
&lt;LandingBody /&gt;
&lt;Footer /&gt;</code></pre>
            
            <h3>2. Body Component: <code>abicore/screens/components/landing_body.abx</code></h3>
            <pre><code>re&#110;der ProfileCard from "components/profile_card"

&lt;script prepare&gt;
    const os = require('os');
&lt;/script&gt;

&lt;section class="hero-section d-flex align-items-center"&gt;
    &lt;div class="container"&gt;
        &lt;div class="row align-items-center justify-content-center"&gt;
            &lt;div class="col-lg-9 text-center"&gt;
                &lt;h1 class="display-3 fw-bold mb-4 text-white"&gt;
                    {&#123; lang.title }}
                &lt;/h1&gt;
                &lt;p class="lead text-muted mb-5 fs-5"&gt;
                    {&#123; lang.subtitle }}
                &lt;/p&gt;
                &lt;div class="mb-4"&gt;
                    &lt;ProfileCard /&gt;
                &lt;/div&gt;
                &lt;div class="card card-custom p-4 text-start mx-auto" style="max-width: 600px;"&gt;
                    &lt;h5 class="text-white mb-3"&gt;System Information&lt;/h5&gt;
                    &lt;div class="row text-muted fs-6"&gt;
                        &lt;div class="col-6 mb-2"&gt;&lt;strong&gt;Platform:&lt;/strong&gt; {&#123; os.platform() }}&lt;/div&gt;
                        &lt;div class="col-6 mb-2"&gt;&lt;strong&gt;Architecture:&lt;/strong&gt; {&#123; os.arch() }}&lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;
&lt;/section&gt;</code></pre>
            
            <h3>3. Leaf Component: <code>abicore/screens/components/profile_card.abx</code></h3>
            <pre><code>&lt;script prepare&gt;
    const name = context.profileName || "Guest User";
    const role = context.profileRole || "Viewer";
&lt;/script&gt;

&lt;div class="card card-custom p-4 text-start mx-auto mb-4" style="max-width: 600px; border-left: 4px solid var(--abi-green);"&gt;
    &lt;h5 class="text-white mb-2"&gt;{&#123; name }}&lt;/h5&gt;
    &lt;p class="text-muted mb-0"&gt;Role: &lt;span class="text-white-50"&gt;{&#123; role }}&lt;/span&gt;&lt;/p&gt;
&lt;/div&gt;</code></pre>
        </section>

        <section id="comparison-table-sec" class="docs-section">
            <h1>Feature Comparison Table</h1>
            <p>A quick summary of how AbiLang stacks up against other major languages:</p>

            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>AbiLang</th>
                        <th>JavaScript</th>
                        <th>Python</th>
                        <th>PHP</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="strong">Variable Keywords</td>
                        <td class="check-yes">None (Dynamic)</td>
                        <td class="check-no">const / let / var</td>
                        <td class="check-yes">None (Dynamic)</td>
                        <td class="check-no">None (Requires $)</td>
                    </tr>
                    <tr>
                        <td class="strong">Semicolons</td>
                        <td class="check-yes">Optional</td>
                        <td class="check-yes">Optional</td>
                        <td class="check-yes">None</td>
                        <td class="check-no">Required</td>
                    </tr>
                    <tr>
                        <td class="strong">Block Scoping</td>
                        <td class="check-yes">Braces {}</td>
                        <td class="check-yes">Braces {}</td>
                        <td class="check-no">Indentation</td>
                        <td class="check-yes">Braces {}</td>
                    </tr>
                    <tr>
                        <td class="strong">Object Orientation</td>
                        <td class="check-yes">Factory Closures / Classes</td>
                        <td class="check-yes">Prototypes / Classes</td>
                        <td class="check-yes">Classes (self)</td>
                        <td class="check-yes">Classes ($this)</td>
                    </tr>
                    <tr>
                        <td class="strong">Async Cloud API fetch</td>
                        <td class="check-yes">Native Built-in</td>
                        <td class="check-no">Library Fetch / Axios</td>
                        <td class="check-no">Library Requests</td>
                        <td class="check-no">Library cURL</td>
                    </tr>
                </tbody>
            </table>
        </section>
    </main>
</div>
EOF

cat << 'EOF' > server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Interpreter, BuiltinFunction } = require('./dist/interpreter');
const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');

require.extensions['.abx'] = function (module, filename) {
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
        
        let relativeToScreens = importPath.startsWith('abicore/screens/') ? importPath : 'abicore/screens/' + importPath;
        let screensPath = path.resolve(process.cwd(), relativeToScreens);
        if (fs.existsSync(screensPath)) return screensPath;
        if (fs.existsSync(screensPath + '.abx')) return screensPath + '.abx';
        
        return directPath;
    };

    if (isTemplate) {
        let script = 'const fs = require("fs");\nconst path = require("path");\nconst fn = function(require, console, context = {}) {\nconst __parts = [];\nwith(context) {\n';
        let processedContent = content;
        processedContent = processedContent.replace(/(?:export\s+component|export|component)\s+(\w+)\s*\{([\s\S]*?)\}/g, '$2');
        const importRegex = /^(?:export\s+)?(?:load|import|inject|render)\s+(\w+)\s+from\s+(?:['"]([^'"]+)['"]|([a-zA-Z0-9_\.]+))\s*$/gm;
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

        processedContent = processedContent.replace(/<script\s+prepare>([\s\S]*?)<\/script>/g, (match, code) => {
            let processedCode = code.trim();
            processedCode = processedCode.replace(/\bimport\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, (m, vars, importPath) => {
                let includePath = path.resolve(path.dirname(filename), importPath);
                if (!fs.existsSync(includePath)) {
                    includePath = path.resolve(process.cwd(), importPath);
                }
                const randomId = Math.floor(Math.random() * 1000000);
                return `const _import_ctx_${randomId} = {}; require(${JSON.stringify(includePath)})(require, console, _import_ctx_${randomId}); const { ${vars} } = _import_ctx_${randomId};`;
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
    const routeFile = path.resolve('abicore/navigation/routes.abi');
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
                    const filePath = path.join(__dirname, screenFile);
                    if (fs.existsSync(filePath)) {
                        const content = renderTemplate(filePath);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content);
                        return;
                    }
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
cat << 'EOF' > abicore/handlers/handler.abi
include("entities/entity.abi")

class Handler {
    public func index() {
        e = Entity()
        print "Calling entity: " + e.data()
        print "Database Config -> Host: " + DB_HOST + ", DB: " + DB_DATABASE
        return screen("index")
    }

    public func docs() {
        return screen("docx")
    }
}
EOF

cat << 'EOF' > abicore/entities/entity.abi
class Entity {
    public func data() {
        return "Entity data"
    }
}
EOF

cat << 'EOF' > abicore/support/helpers.abi
class Support {
    public func get_platform_info() {
        return "Running AbiLang " + VERSION + " by " + AUTHOR
    }
}
EOF

cat << 'EOF' > abicore/constants/constants.abi
APP_TITLE = "AbiLang Bootstrap Portal"
VERSION = "1.2.0"
AUTHOR = "Abinash"

DB_HOST = env("DB_HOST")
DB_PORT = env("DB_PORT")
DB_DATABASE = env("DB_DATABASE")
DB_USERNAME = env("DB_USERNAME")
DB_PASSWORD = env("DB_PASSWORD")
EOF

cat << 'EOF' > abicore/navigation/routes.abi
include("constants/constants.abi")

include("support/helpers.abi")

include("handlers/handler.abi")

route("get", "/", "handler@index", "home")

route("get", "/docs", "handler@docs", "docs")
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
echo '#!/usr/bin/env node' | cat - dist/cli.js > temp && mv temp dist/cli.js
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
            return cleanPath.endsWith(".abx") ? cleanPath : cleanPath + ".abx";
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
npm install --omit=dev
npm link --force

# Install syntax highlighting support for local IDEs
if [ -f "$SCRIPT_DIR/scripts/install-syntax.js" ]; then
    echo "Configuring local IDE syntax coloring..."
    node "$SCRIPT_DIR/scripts/install-syntax.js"
fi

echo ""
echo "╭─────────────────────────────────────────────╮"
echo "│  🚀 AbiLang                                 │"
echo "│                                             │"
echo "│  ✓ Project created successfully             │"
echo "│                                             │"
echo "│  📂 $(pwd)                                  │"
echo "│                                             │"
echo "│  ▶ Start development                        │"
echo "│     npm run web                             │"
echo "╰─────────────────────────────────────────────╯"
echo ""