const http = require('http');
const fs = require('fs');
const path = require('path');
const { Interpreter, BuiltinFunction } = require('./dist/interpreter');
const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');

require.extensions['.ui'] = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    let script = 'const fs = require("fs");\nconst path = require("path");\nmodule.exports = function(require, console, context = {}) {\nconst __parts = [];\n';
    let processedContent = content;
    const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
    processedContent = processedContent.replace(includeRegex, (match, subPath) => {
        let includePath = path.resolve(path.dirname(filename), subPath);
        if (!fs.existsSync(includePath)) {
            includePath = path.resolve(process.cwd(), subPath);
        }
        return `<%= require(${JSON.stringify(includePath)})(require, console, context) %>`;
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
    script += `return __parts.join("");\n};\n`;
    const esbuild = require('esbuild');
    const transpiled = esbuild.transformSync(script, {
        loader: 'jsx',
        target: 'node18',
        format: 'cjs'
    }).code;
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
    '.ui': 'text/html',
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
    interpreter.globals.define("screen", new BuiltinFunction(1, async (args) => {
        const pathName = String(args[0]);
        const cleanPath = pathName.startsWith("screens/") ? pathName : "screens/" + pathName;
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
    const routeFile = path.resolve('navigation/routes.abi');
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
    const templateFunc = require(resolved);
    return templateFunc(require, console, {});
}

function clearAllCache() {
    Object.keys(require.cache).forEach(key => {
        if (key.endsWith('.ui') || key.includes('/handlers/') || key.includes('/entities/') || key.includes('/support/')) {
            delete require.cache[key];
        }
    });
}

function startWatcher() {
    const dirs = ['navigation', 'handlers', 'entities', 'support', 'screens'];
    dirs.forEach(dir => {
        const dirPath = path.resolve(dir);
        if (fs.existsSync(dirPath)) {
            fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                clearAllCache();
                loadRoutes().catch(console.error);
                console.log(`[Reload] Reloaded changes in ${dir}/${filename}`);
            });
        }
    });
}

async function startServer() {
    await loadRoutes();
    startWatcher();

    const server = http.createServer(async (req, res) => {
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
                    handlerFunc = new BoundMethod(instance, method);
                }
            }

            if (handlerFunc && typeof handlerFunc.call === 'function') {
                let screenFile = await handlerFunc.call(interpreter, []);
                if (screenFile && typeof screenFile === 'string') {
                    if (!screenFile.startsWith('screens/')) {
                        screenFile = 'screens/' + screenFile;
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
        console.log(`Server running at http://127.0.0.1:${port}/`);
    });
    server.listen(port, '127.0.0.1');
}

startServer().catch(err => {
    console.error(err);
    process.exit(1);
});
