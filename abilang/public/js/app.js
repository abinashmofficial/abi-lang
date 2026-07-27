// Define templates
const templates = {
    hello: `# AbiLang Basics & Math

# 1. Variables
greeting = "Welcome, Abinash!"
print greeting

# 2. Math calculations & precedence
print "Calculating 100 + 50 * (4 / 2):"
result = 100 + 50 * (4 / 2)
print result

# 3. Logical evaluations
is_active = true
is_valid = false

print "Logical evaluation (true and not false):"
print is_active and not is_valid
`,

    flow: `# AbiLang Conditional Flow & Loops

# 1. Capture keyboard input
name = input "What is your name? "
print "Hello, " + name + "!"

# 2. If/Else condition check
age = input "How old are you? "
if age >= 18 {
    print name + " is authorized as an adult."
} else {
    print name + " is flagged as a minor."
}

# 3. Loop iterations
print "Iterating count using while loop:"
count = 1
while count <= 3 {
    print "Value: " + count
    count = count + 1
}

# 4. Array Sample & Native For-Loop
print ""
print "Array iteration using for loop:"
fruits = ["apple", "banana", "cherry"]
for fruit in fruits {
    print "I like " + fruit
}
`,

    functions: `# AbiLang Functions & Modular Logic

# 1. Declaring a function with arguments and local variables
func calculate_bill(price, quantity) {
    tax_rate = 0.18
    raw_total = price * quantity
    tax_amount = raw_total * tax_rate
    return raw_total + tax_amount
}

# 2. Executing the function and collecting returns
price_item = 250
qty = 4

print "Calculating raw + 18% tax for 4 items costing 250 each:"
total_bill = calculate_bill(price_item, qty)
print "Total bill: " + total_bill
`,

    cloud: `# AbiLang Cloud Connect (REST Database simulation)

# 1. Define function fetching post data from cloud REST database
func fetch_post_data(post_id) {
    url = "https://jsonplaceholder.typicode.com/posts/" + post_id
    print "Sending HTTP GET Request to: " + url
    
    # Built-in async fetch returns raw response string
    raw_response = fetch(url)
    
    # Built-in json_parse converts string to AbiLang dictionary
    post_dict = json_parse(raw_response)
    return post_dict
}

# 2. Trigger fetch
post = fetch_post_data(1)

# 3. Output parsed fields
print "--- Cloud Content Retrieved ---"
print "Title: " + post.title
print "User ID: " + post.userId
`,

    mobile: `# AbiLang Declarative Mobile & iOS UI

# 1. Initialize count state
count = 0

# 2. Define callback to handle click events
func increment_counter() {
    count = count + 1
    # Redraw UI with updated state
    draw_screen()
}

# 3. Build and render the UI layout
func draw_screen() {
    title = create_text("AbiLang App Frame")
    desc = create_text("This UI renders natively on Web, Android, and iOS viewports.")
    
    status_label = create_text("Button click count: " + count)
    click_btn = create_button("Tap to Increment", increment_counter)
    
    # Pack layout inside a vertical column container
    layout = create_column([title, desc, status_label, click_btn])
    
    # Expose layout to mobile simulator canvas
    render_ui(layout)
}

# 4. Initialize first render
draw_screen()
`
};

// DOM Elements
const editor = document.getElementById("editor");
const lineNumbers = document.getElementById("line-numbers");
const terminal = document.getElementById("terminal");
const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");
const templateButtons = document.querySelectorAll(".template-item");

const statusBadge = document.getElementById("runtime-status");
const statusDot = document.getElementById("runtime-status-dot");

const tabButtons = document.querySelectorAll(".hud-tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const astContainer = document.getElementById("ast-container");
const variablesContainer = document.getElementById("variables-container");

function highlightAbiLang(code) {
    let html = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tokenRegex = /(#(?:.*)$|\/\/(?:.*)$)|(".*?"|'.*?')|(\b(?:if|else|while|return|func|class|extends|public|private|protected|try|catch|finally|import|from|inject|render|export)\b)|(\b(?:and|or|not)\b)|(\b(?:true|false|null)\b)|(\b(?:print|input|fetch|json_parse|create_text|create_button|create_column|create_row|render_ui|draw_screen|db_connect|db_create|db_update|db_delete|db_fetch|dd)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s*\())|(\b\d+(?:\.\d+)?\b)/gm;

    html = html.replace(tokenRegex, (match, comment, string, keyword, logical, constant, builtin, className, funcName, number) => {
        if (comment) return `<span class="token-comment">${match}</span>`;
        if (string) return `<span class="token-string">${match}</span>`;
        if (keyword) return `<span class="token-keyword">${match}</span>`;
        if (logical) return `<span class="token-logical">${match}</span>`;
        if (constant) return `<span class="token-constant">${match}</span>`;
        if (builtin) return `<span class="token-builtin">${match}</span>`;
        if (className) return `<span class="token-class">${match}</span>`;
        if (funcName) return `<span class="token-function">${match}</span>`;
        if (number) return `<span class="token-number">${match}</span>`;
        return match;
    });

    return html;
}

function highlightBash(code) {
    let html = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tokenRegex = /(#(?:.*)$)|(".*?"|'.*?')|(\b(?:curl|git|npm|node|cd|bash|mkdir|sudo)\b)|(-\w+|--\w+[-\w]*)|(\b(?:clone|install|run|build|web|init|push|pull|add|commit|checkout|status)\b)|(https?:\/\/[^\s<]+)/gm;

    html = html.replace(tokenRegex, (match, comment, string, cmd, option, param, url) => {
        if (comment) return `<span class="token-comment">${match}</span>`;
        if (string) return `<span class="token-string">${match}</span>`;
        if (cmd) return `<span class="token-keyword">${match}</span>`;
        if (option) return `<span class="token-logical">${match}</span>`;
        if (param) return `<span class="token-builtin">${match}</span>`;
        if (url) return `<span class="token-class">${match}</span>`;
        return match;
    });

    return html;
}

function updateHighlighting() {
    const highlightContent = document.getElementById("highlighting-content");
    if (highlightContent) {
        highlightContent.innerHTML = highlightAbiLang(editor.value) + "\n";
    }
}

if (editor) {
    editor.value = templates.hello;
    updateLineNumbers();
    updateHighlighting();
}

function updateLineNumbers() {
    if (!editor || !lineNumbers) return;
    const lines = editor.value.split("\n");
    lineNumbers.innerHTML = "";
    for (let i = 1; i <= lines.length; i++) {
        const div = document.createElement("div");
        div.innerText = i;
        lineNumbers.appendChild(div);
    }
}

if (editor) {
    editor.addEventListener("input", () => {
        updateLineNumbers();
        updateHighlighting();
    });

    editor.addEventListener("scroll", () => {
        if (lineNumbers) lineNumbers.scrollTop = editor.scrollTop;
        const backdrop = document.getElementById("editor-backdrop");
        if (backdrop) {
            backdrop.scrollTop = editor.scrollTop;
            backdrop.scrollLeft = editor.scrollLeft;
        }
    });

    editor.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            updateLineNumbers();
            updateHighlighting();
        }
    });
}

// 2. Tab Switching Logic
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        
        btn.classList.add("active");
        const tabId = "tab-" + btn.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
    });
});

// 3. Preset Templates Setup
templateButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        templateButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const templateKey = btn.getAttribute("data-template");
        if (templates[templateKey] && editor) {
            editor.value = templates[templateKey];
            updateLineNumbers();
            updateHighlighting();
            const fileName = btn.textContent.trim().replace(/^V\s*/, "");
            appendSystemMessage(`Loaded component template: ${fileName}`);
        }
    });
});

// Clear console
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (terminal) terminal.innerHTML = "";
        appendSystemMessage("Console logs purged.");
    });
}

// Console appenders
function appendSystemMessage(text) {
    const line = document.createElement("div");
    line.className = "terminal-line sys-line";
    line.innerText = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function appendErrorMessage(text) {
    const line = document.createElement("div");
    line.className = "terminal-line error-msg";
    line.innerText = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

// Browser IO Handler
class BrowserIOHandler {
    constructor() {
        this.interpreter = null;
    }

    setInterpreter(interpreter) {
        this.interpreter = interpreter;
    }

    print(message) {
        const line = document.createElement("div");
        line.className = "terminal-line output";
        line.innerText = message.endsWith("\n") ? message.slice(0, -1) : message;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    input(promptText) {
        const wrapper = document.createElement("div");
        wrapper.className = "terminal-input-wrapper";

        const label = document.createElement("span");
        label.className = "terminal-prompt-label";
        label.innerText = promptText;
        wrapper.appendChild(label);

        const inputEl = document.createElement("input");
        inputEl.type = "text";
        inputEl.className = "terminal-input";
        inputEl.autofocus = true;
        wrapper.appendChild(inputEl);

        terminal.appendChild(wrapper);
        terminal.scrollTop = terminal.scrollHeight;

        setTimeout(() => inputEl.focus(), 15);

        return new Promise((resolve) => {
            const handleKeydown = (e) => {
                if (e.key === "Enter") {
                    const value = inputEl.value;
                    inputEl.removeEventListener("keydown", handleKeydown);

                    wrapper.innerHTML = "";
                    
                    const staticLabel = document.createElement("span");
                    staticLabel.className = "terminal-prompt-label";
                    staticLabel.innerText = promptText;
                    
                    const staticValue = document.createElement("span");
                    staticValue.style.color = "inherit";
                    staticValue.innerText = value;

                    wrapper.appendChild(staticLabel);
                    wrapper.appendChild(staticValue);

                    resolve(value);
                }
            };
            inputEl.addEventListener("keydown", handleKeydown);
        });
    }

    renderUI(element) {
        const screen = document.getElementById("mobile-screen");
        if (!screen) return;
        screen.innerHTML = "";
        
        const clock = document.createElement("div");
        clock.className = "clock-display";
        const now = new Date();
        clock.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        screen.appendChild(clock);

        const rootNode = this.buildUIDOM(element);
        if (rootNode) {
            screen.appendChild(rootNode);
        }
        
        // Auto navigate to mobile sim tab
        const mobTabBtn = document.querySelector('[data-tab="mobile"]');
        if (mobTabBtn) {
            mobTabBtn.click();
        }
    }
    
    buildUIDOM(el) {
        if (!el || typeof el !== "object") return null;
        
        if (el.type === "text") {
            const div = document.createElement("div");
            div.className = "sim-text";
            div.innerText = el.content;
            return div;
        }
        
        if (el.type === "button") {
            const btn = document.createElement("button");
            btn.className = "sim-button";
            btn.innerText = el.text;
            
            if (el.onClick) {
                btn.addEventListener("click", async () => {
                    try {
                        if (this.interpreter) {
                            await el.onClick.call(this.interpreter, []);
                            renderVariables(this.interpreter);
                        }
                    } catch(err) {
                        appendErrorMessage("UI Click Action Error: " + err.message);
                    }
                });
            }
            return btn;
        }
        
        if (el.type === "column") {
            const div = document.createElement("div");
            div.className = "sim-column";
            if (el.children) {
                el.children.forEach(child => {
                    const childNode = this.buildUIDOM(child);
                    if (childNode) div.appendChild(childNode);
                });
            }
            return div;
        }
        
        if (el.type === "row") {
            const div = document.createElement("div");
            div.className = "sim-row";
            if (el.children) {
                el.children.forEach(child => {
                    const childNode = this.buildUIDOM(child);
                    if (childNode) div.appendChild(childNode);
                });
            }
            return div;
        }
        
        return null;
    }
}

// 4. Render AST (Abstract Syntax Tree) Visualization
function renderAST(statements) {
    astContainer.innerHTML = "";
    if (!statements || statements.length === 0) {
        astContainer.innerHTML = `<div class="placeholder-msg">Empty AST tree.</div>`;
        return;
    }

    statements.forEach(stmt => {
        astContainer.appendChild(createASTNodeDOM(stmt));
    });
}

function createASTNodeDOM(node) {
    const card = document.createElement("div");
    card.className = "ast-node-card";

    const header = document.createElement("div");
    header.className = "ast-node-header";
    header.innerText = node.type;
    card.appendChild(header);

    Object.keys(node).forEach(key => {
        if (key === "type" || key === "line") return;

        const propDiv = document.createElement("div");
        propDiv.className = "ast-node-prop";

        const val = node[key];
        if (val && typeof val === "object" && "type" in val) {
            // Nested Node
            propDiv.innerHTML = `<span>${key}:</span>`;
            propDiv.appendChild(createASTNodeDOM(val));
        } else if (Array.isArray(val)) {
            // Array of Nodes or Primitives
            propDiv.innerHTML = `<span>${key} (${val.length} nodes):</span>`;
            val.forEach(item => {
                if (item && typeof item === "object" && "type" in item) {
                    propDiv.appendChild(createASTNodeDOM(item));
                } else {
                    const rawVal = document.createElement("div");
                    rawVal.className = "ast-node-val";
                    rawVal.innerText = JSON.stringify(item);
                    propDiv.appendChild(rawVal);
                }
            });
        } else {
            // Primitive
            propDiv.innerHTML = `<span>${key}:</span> <span class="ast-node-val">${JSON.stringify(val)}</span>`;
        }
        card.appendChild(propDiv);
    });

    return card;
}

// 5. Render Variables Memory Scope Inspector
function renderVariables(interpreter) {
    variablesContainer.innerHTML = "";
    const variables = interpreter.getVariables();
    const keys = Object.keys(variables);

    if (keys.length === 0) {
        variablesContainer.innerHTML = `<div class="placeholder-msg">No active variables in memory.</div>`;
        return;
    }

    const grid = document.createElement("div");
    grid.className = "variables-grid";

    keys.forEach(name => {
        const val = variables[name];
        
        const card = document.createElement("div");
        card.className = "var-card";

        const header = document.createElement("div");
        header.className = "var-header";

        const nameEl = document.createElement("span");
        nameEl.className = "var-name";
        nameEl.innerText = name;

        const typeEl = document.createElement("span");
        typeEl.className = "var-type";

        let typeStr = "unknown";
        if (val === null) typeStr = "null";
        else if (Array.isArray(val)) typeStr = "list";
        else if (typeof val === "object" && ("arity" in val)) typeStr = "func";
        else if (typeof val === "object") typeStr = "dict";
        else typeStr = typeof val;

        typeEl.innerText = typeStr;
        header.appendChild(nameEl);
        header.appendChild(typeEl);

        const valEl = document.createElement("div");
        valEl.className = "var-value";

        if (val === null) {
            valEl.innerText = "null";
        } else if (typeof val === "object" && ("arity" in val)) {
            valEl.innerText = `<function arity:${val.arity()}>`;
        } else if (typeof val === "object") {
            valEl.innerText = JSON.stringify(val);
        } else {
            valEl.innerText = String(val);
        }

        card.appendChild(header);
        card.appendChild(valEl);
        grid.appendChild(card);
    });

    variablesContainer.appendChild(grid);
}

// 6. Run Execution Triggers
if (runBtn) {
    runBtn.addEventListener("click", async () => {
        if (!editor) return;
        const code = editor.value;
        if (!code.trim()) {
            appendSystemMessage("Editor is empty. Write some code first.");
            return;
        }

    runBtn.disabled = true;
    const originalText = runBtn.innerHTML;
    runBtn.innerHTML = `
        <svg class="icon-run spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; width: 12px; height: 12px; margin-right: 6px;">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        Running...
    `;
    statusBadge.innerText = "Running";
    statusDot.classList.add("running");
    
    appendSystemMessage("--- [Start Execution] ---");

    try {
        if (!window.AbiLang) {
            throw new Error("Compiler library AbiLang not loaded. Please build the project.");
        }

        const lexer = new AbiLang.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new AbiLang.Parser(tokens);
        const statements = parser.parse();

        // Render AST Tree
        renderAST(statements);

        const io = new BrowserIOHandler();
        const interpreter = new AbiLang.Interpreter(io);
        io.setInterpreter(interpreter);
        
        // Execute Code
        await interpreter.interpret(statements);

        // Render Variables Scope
        renderVariables(interpreter);

        appendSystemMessage("--- [Execution Complete] ---");
    } catch (err) {
        appendErrorMessage(err.message || "Runtime Exception occurred.");
        if (err.message && !err.message.includes("not loaded")) {
            try {
                const lexer = new AbiLang.Lexer(code);
                const parser = new AbiLang.Parser(lexer.tokenize());
                renderAST(parser.parse());
            } catch(e) {}
        }
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = originalText;
        statusBadge.innerText = "Idle";
        statusDot.classList.remove("running");
    }
});
}

// Inject spinner anim CSS
const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }\n.loading-anim {\n    position: fixed;\n    inset: 0;\n    background: var(--bg-app);\n    display: flex;\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n    color: var(--text-main);\n    font-family: var(--font-sans);\n    font-size: 1.5rem;\n    z-index: 10000;\n    opacity: 1;\n    transition: opacity 0.6s ease;\n}\n.loading-anim.loaded {\n    opacity: 0;\n    pointer-events: none;\n}';
document.getElementsByTagName('head')[0].appendChild(style);

// Portal & Workspace Switcher Logic
const launchBtn = document.getElementById("launch-btn");
const navPlaygroundBtn = document.getElementById("nav-playground-btn");
const btnGetStarted = document.getElementById("btn-get-started");
const portalView = document.getElementById("portal-view");
const hudView = document.getElementById("hud-view");

// "Get Started" inside workspace header switches back to landing page installation guide
if (btnGetStarted && portalView && hudView) {
    btnGetStarted.addEventListener("click", (e) => {
        e.preventDefault();
        hudView.style.display = "none";
        portalView.style.display = "flex";
        portalView.classList.remove("glitch-fade-out");
        
        // Scroll directly to installation setups section
        const installSection = document.querySelector(".portal-installation");
        if (installSection) {
            installSection.scrollIntoView({ behavior: "smooth" });
        }
    });
}

// "Get Started" in landing hero launches the workspace editor
if (launchBtn && portalView && hudView) {
    launchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        portalView.classList.add("glitch-fade-out");
        setTimeout(() => {
            portalView.style.display = "none";
            hudView.style.display = "flex";
            hudView.classList.add("fade-in");
            updateLineNumbers();
            editor.focus();
        }, 400);
    });
} else if (launchBtn) {
    launchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html?start=true";
    });
}

// "Playground" navbar link transitions to editor workspace
if (navPlaygroundBtn && portalView && hudView) {
    navPlaygroundBtn.addEventListener("click", (e) => {
        e.preventDefault();
        portalView.classList.add("glitch-fade-out");
        setTimeout(() => {
            portalView.style.display = "none";
            hudView.style.display = "flex";
            hudView.classList.add("fade-in");
            updateLineNumbers();
            editor.focus();
        }, 400);
    });
}

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-toggle-icon");
if (themeToggle && themeIcon) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        const hasDark = document.body.classList.contains("dark-theme");
        themeIcon.innerText = hasDark ? "☀" : "🌙";
        try {
            localStorage.setItem("theme", hasDark ? "dark" : "light");
        } catch (e) {}
    });
    let preferredTheme = "light";
    try {
        preferredTheme = localStorage.getItem("theme") || "light";
    } catch (e) {}
    if (preferredTheme === "dark") {
        document.body.classList.add("dark-theme");
        themeIcon.innerText = "☀";
    } else {
        document.body.classList.remove("dark-theme");
        themeIcon.innerText = "🌙";
    }
}

// OS Tab Switcher Handler
const osTabButtons = document.querySelectorAll(".os-tab-btn");
const osContents = document.querySelectorAll(".os-content");

if (osTabButtons && osContents) {
    osTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            osTabButtons.forEach(b => b.classList.remove("active"));
            osContents.forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const osId = "os-" + btn.getAttribute("data-os");
            const activeContent = document.getElementById(osId);
            if (activeContent) {
                activeContent.classList.add("active");
            }
        });
    });
}

// Back link to view portal from editor footer
const viewPortalLink = document.getElementById("view-portal-link");
if (viewPortalLink && portalView && hudView) {
    viewPortalLink.addEventListener("click", (e) => {
        e.preventDefault();
        hudView.style.display = "none";
        portalView.style.display = "flex";
        portalView.classList.remove("glitch-fade-out");
    });
}
window.addEventListener('DOMContentLoaded', () => {
  // Check if start/launch parameter is present to auto-start playground
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('start') === 'true' || urlParams.get('launch') === 'true') {
      const launchBtn = document.getElementById("launch-btn");
      if (launchBtn) {
          launchBtn.click();
      }
  }

  const loadingAnim = document.querySelector('.loading-anim');
  if (loadingAnim) {
    loadingAnim.classList.add('loaded');
    setTimeout(() => loadingAnim.remove(), 600);
  }

  const allCodes = document.querySelectorAll('pre code');
  allCodes.forEach(codeBlock => {
      if (codeBlock.id === 'highlighting-content') return;
      const rawText = codeBlock.textContent;
      if (codeBlock.classList.contains("language-bash") || codeBlock.classList.contains("bash") || rawText.trim().startsWith("curl") || rawText.trim().startsWith("git") || rawText.trim().startsWith("npm") || rawText.trim().startsWith("node")) {
          codeBlock.innerHTML = highlightBash(rawText);
      } else {
          codeBlock.innerHTML = highlightAbiLang(rawText);
      }
  });

  const installCodeBlocks = document.querySelectorAll('.install-code-blocks pre');
  installCodeBlocks.forEach(pre => {
      const codeElement = pre.querySelector('code');
      if (!codeElement) return;
      if (pre.querySelector('.copy-btn') || pre.parentNode.classList.contains('code-wrapper')) return;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.setAttribute('title', 'Copy code');
      copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
      `;

      function showCopiedState() {
          copyBtn.classList.add('copied');
          copyBtn.setAttribute('title', 'Copied!');
          copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
          `;
          setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.setAttribute('title', 'Copy code');
              copyBtn.innerHTML = `
                  <svg viewBox="0 0 24 24">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
              `;
          }, 2000);
      }

      function fallbackCopy(text) {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
              document.execCommand('copy');
              showCopiedState();
          } catch (err) {
              console.error(err);
          }
          document.body.removeChild(textArea);
      }

      copyBtn.addEventListener('click', () => {
          let text = codeElement.textContent;
          text = text.replace(/\/\*[\s\S]*?\*\//g, '');
          text = text.replace(/\/\/.*$/gm, '');
          text = text.replace(/#.*$/gm, '');
          const cleanText = text.split('\n')
              .map(line => line.trimEnd())
              .filter(line => line.trim() !== '')
              .join('\n');
          if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(cleanText).then(() => {
                  showCopiedState();
              }).catch(() => {
                  fallbackCopy(cleanText);
              });
          } else {
              fallbackCopy(cleanText);
          }
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyBtn);
  });

  // Live Search Filtering for Sidebar Docs
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
      searchInput.addEventListener("input", (e) => {
          const query = e.target.value.toLowerCase().trim();
          const navItems = document.querySelectorAll(".nav-item");
          const sections = document.querySelectorAll(".docs-section");
          
          navItems.forEach(item => {
              const text = item.textContent.toLowerCase();
              if (query === "" || text.includes(query)) {
                  item.style.display = "";
              } else {
                  item.style.display = "none";
              }
          });
          
          sections.forEach(section => {
              const content = section.textContent.toLowerCase();
              if (query === "" || content.includes(query)) {
                  section.style.display = "";
              } else {
                  section.style.display = "none";
              }
          });
      });
  }

  // Sidebar Active Scroll Highlighting
  const sections = document.querySelectorAll(".docs-section");
  const navLinks = document.querySelectorAll(".nav-link");
  if (sections.length > 0 && navLinks.length > 0) {
      window.addEventListener("scroll", () => {
          let current = "";
          sections.forEach(section => {
              const sectionTop = section.offsetTop;
              if (window.scrollY >= (sectionTop - 150)) {
                  current = section.getAttribute("id");
              }
          });
          
          navLinks.forEach(link => {
              link.classList.remove("active");
              if (link.getAttribute("href") === "#" + current) {
                  link.classList.add("active");
                  const parent = link.closest('.nav-item');
                  if (parent) {
                      parent.style.display = "";
                  }
              }
          });
      });
  }
});

const canvas = document.getElementById("star-rain-canvas");
if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
        width = (canvas.width = window.innerWidth);
        height = (canvas.height = window.innerHeight);
    });

    const stars = [];

    function createStar() {
        return {
            x: Math.random() * width,
            y: Math.random() * -height,
            length: Math.random() * 80 + 20,
            speed: Math.random() * 15 + 5,
            opacity: Math.random() * 0.6 + 0.2,
            width: Math.random() * 1.5 + 0.5
        };
    }

    for (let i = 0; i < 40; i++) {
        stars.push(createStar());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const isDark = document.body.classList.contains("dark-theme");
        const starColor = isDark ? "123, 255, 0" : "109, 40, 217";
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            ctx.beginPath();
            const gradient = ctx.createLinearGradient(s.x, s.y, s.x - s.length * 0.5, s.y + s.length);
            gradient.addColorStop(0, `rgba(${starColor}, 0)`);
            gradient.addColorStop(1, `rgba(${starColor}, ${s.opacity})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = s.width;
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.length * 0.2, s.y + s.length);
            ctx.stroke();
            s.x -= s.speed * 0.2;
            s.y += s.speed;
            if (s.y > height || s.x < 0) {
                stars[i] = createStar();
                stars[i].y = -20;
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.line-copy-btn');
    if (!btn) return;
    const text = btn.getAttribute('data-text');
    if (!text) return;
    
    function showState() {
        btn.classList.add('copied');
        btn.setAttribute('title', 'Copied!');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: #42b883;">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
        `;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.setAttribute('title', 'Copy line');
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
            `;
        }, 2000);
    }

    function fallbackCopy(val) {
        const textArea = document.createElement("textarea");
        textArea.value = val;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showState();
        } catch (err) {
            console.error(err);
        }
        document.body.removeChild(textArea);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showState).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
});
