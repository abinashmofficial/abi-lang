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
                const kw = keyword || 'let';
                return `${kw} ${name} = context.${name} =`;
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
        const needsLayoutWrapper = !fileContent.includes('Header') && !fileContent.includes('Layout');
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
