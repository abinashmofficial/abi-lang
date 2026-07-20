"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.Environment = exports.BoundMethod = exports.ClassInstance = exports.ClassCallable = exports.UserFunction = exports.BuiltinFunction = exports.ReturnException = void 0;
class ReturnException {
    value;
    constructor(value) {
        this.value = value;
    }
}
exports.ReturnException = ReturnException;
class BuiltinFunction {
    fn;
    paramCount;
    constructor(paramCount, fn) {
        this.paramCount = paramCount;
        this.fn = fn;
    }
    arity() {
        return this.paramCount;
    }
    async call(interpreter, args) {
        return await this.fn(args);
    }
}
exports.BuiltinFunction = BuiltinFunction;
class UserFunction {
    declaration;
    closure;
    constructor(declaration, closure) {
        this.declaration = declaration;
        this.closure = closure;
    }
    arity() {
        return this.declaration.params.length;
    }
    async call(interpreter, args) {
        const env = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            env.define(this.declaration.params[i], args[i]);
        }
        try {
            await interpreter.executeBlock(this.declaration.body, env);
        }
        catch (err) {
            if (err instanceof ReturnException) {
                return err.value;
            }
            throw err;
        }
        return null;
    }
}
exports.UserFunction = UserFunction;
class ClassCallable {
    declaration;
    constructor(declaration) {
        this.declaration = declaration;
    }
    arity() {
        return 0;
    }
    async call(interpreter, args) {
        return new ClassInstance(this);
    }
}
exports.ClassCallable = ClassCallable;
class ClassInstance {
    klass;
    fields = new Map();
    constructor(klass) {
        this.klass = klass;
    }
    toString() {
        return `<instance of ${this.klass.declaration.name}>`;
    }
}
exports.ClassInstance = ClassInstance;
class BoundMethod {
    instance;
    method;
    constructor(instance, method) {
        this.instance = instance;
        this.method = method;
    }
    arity() {
        return this.method.params.length;
    }
    async call(interpreter, args) {
        const env = new Environment(interpreter.globals);
        env.define("this", this.instance);
        for (let i = 0; i < this.method.params.length; i++) {
            env.define(this.method.params[i], args[i]);
        }
        try {
            await interpreter.executeBlock(this.method.body, env);
        }
        catch (err) {
            if (err instanceof ReturnException) {
                return err.value;
            }
            throw err;
        }
        return null;
    }
}
exports.BoundMethod = BoundMethod;
class Environment {
    values = new Map();
    outer;
    constructor(outer = null) {
        this.outer = outer;
    }
    getOuter() {
        return this.outer;
    }
    getVariables() {
        return this.values;
    }
    define(name, value) {
        this.values.set(name, value);
    }
    get(name, line) {
        if (this.values.has(name)) {
            return this.values.get(name);
        }
        if (this.outer) {
            return this.outer.get(name, line);
        }
        throw new Error(`[Runtime Error] Undefined variable '${name}' at line ${line}.`);
    }
    assign(name, value, line) {
        if (this.values.has(name)) {
            this.values.set(name, value);
            return;
        }
        if (this.outer) {
            this.outer.assign(name, value, line);
            return;
        }
        // Default: define in local scope if it doesn't exist anywhere
        this.values.set(name, value);
    }
}
exports.Environment = Environment;
class Interpreter {
    io;
    globals = new Environment();
    environment = this.globals;
    getVariables() {
        const vars = {};
        let curr = this.environment;
        while (curr !== null) {
            for (const [key, val] of curr.getVariables().entries()) {
                if (key === "fetch" || key === "json_parse" || key === "json_stringify" || key === "date_now") {
                    continue;
                }
                if (vars[key] === undefined) {
                    vars[key] = val;
                }
            }
            curr = curr.getOuter();
        }
        return vars;
    }
    constructor(io) {
        this.io = io;
        this.setupGlobals();
    }
    setupGlobals() {
        // 1. Fetch for cloud APIs (works in Node 18+ and Browser natively)
        this.globals.define("fetch", new BuiltinFunction(1, async (args) => {
            const url = args[0];
            const options = args[1] || {};
            const fetchOptions = {};
            if (options.method)
                fetchOptions.method = String(options.method);
            if (options.headers) {
                fetchOptions.headers = options.headers;
            }
            if (options.body) {
                fetchOptions.body = typeof options.body === "object" ? JSON.stringify(options.body) : String(options.body);
            }
            try {
                const res = await fetch(url, fetchOptions);
                return await res.text();
            }
            catch (err) {
                throw new Error(`Cloud fetch failed: ${err.message}`);
            }
        }));
        // 2. Parse JSON
        this.globals.define("json_parse", new BuiltinFunction(1, (args) => {
            try {
                return JSON.parse(args[0]);
            }
            catch (e) {
                throw new Error(`JSON parse error: ${e.message}`);
            }
        }));
        // 3. Stringify JSON
        this.globals.define("json_stringify", new BuiltinFunction(1, (args) => {
            return JSON.stringify(args[0], null, 2);
        }));
        // 4. Timestamp
        this.globals.define("date_now", new BuiltinFunction(0, () => Date.now()));
        // 5. Declarative UI Component Helpers
        this.globals.define("create_text", new BuiltinFunction(1, (args) => {
            return { type: "text", content: String(args[0]) };
        }));
        this.globals.define("create_button", new BuiltinFunction(2, (args) => {
            return { type: "button", text: String(args[0]), onClick: args[1] };
        }));
        this.globals.define("create_column", new BuiltinFunction(1, (args) => {
            return { type: "column", children: Array.isArray(args[0]) ? args[0] : [args[0]] };
        }));
        this.globals.define("create_row", new BuiltinFunction(1, (args) => {
            return { type: "row", children: Array.isArray(args[0]) ? args[0] : [args[0]] };
        }));
        this.globals.define("render_ui", new BuiltinFunction(1, async (args) => {
            const uiElement = args[0];
            if (this.io && "renderUI" in this.io && typeof this.io.renderUI === "function") {
                await this.io.renderUI(uiElement);
            }
            else {
                this.io.print(`[UI Render Log] ${JSON.stringify(uiElement, null, 2)}\n`);
            }
            return null;
        }));
        this.globals.define("db_connect", new BuiltinFunction(1, (args) => {
            return { connected: true, config: args[0], host: "localhost" };
        }));
        this.globals.define("db_create", new BuiltinFunction(2, (args) => {
            const table = args[0];
            const data = args[1] || {};
            const record = { id: Math.floor(Math.random() * 1000) + 1, ...data };
            this.io.print(`[DB Create] Inserted into ${table}: ${JSON.stringify(record)}\n`);
            return record;
        }));
        this.globals.define("db_update", new BuiltinFunction(3, (args) => {
            const table = args[0];
            const id = args[1];
            const data = args[2] || {};
            this.io.print(`[DB Update] Updated ${table} (ID: ${id}) with: ${JSON.stringify(data)}\n`);
            return true;
        }));
        this.globals.define("db_delete", new BuiltinFunction(2, (args) => {
            const table = args[0];
            const id = args[1];
            this.io.print(`[DB Delete] Deleted from ${table} (ID: ${id})\n`);
            return true;
        }));
        this.globals.define("db_fetch", new BuiltinFunction(2, (args) => {
            const table = args[0];
            const query = args[1] || {};
            const mockRecords = [
                { id: 1, name: "Item A", status: "active" },
                { id: 2, name: "Item B", status: "pending" }
            ];
            this.io.print(`[DB Fetch] Queried ${table} with: ${JSON.stringify(query)}\n`);
            return mockRecords;
        }));
        this.globals.define("dd", new BuiltinFunction(1, (args) => {
            const val = args[0];
            const dumpStr = `\n================ [Laravel-like DD Dump] ================\n` +
                `Type: ${val === null ? 'null' : typeof val}\n` +
                `Value: ${this.stringify(val)}\n` +
                `=======================================================\n`;
            this.io.print(dumpStr);
            return val;
        }));
    }
    async interpret(statements) {
        try {
            for (const statement of statements) {
                await this.execute(statement);
            }
        }
        catch (err) {
            if (err instanceof ReturnException) {
                this.io.print("\nError: Return statements are only allowed inside functions.\n");
            }
            else {
                this.io.print(`\nError: ${err.message}\n`);
            }
            throw err;
        }
    }
    async execute(stmt) {
        switch (stmt.type) {
            case "PrintStatement":
                await this.executePrint(stmt);
                break;
            case "VarDeclStatement":
                await this.executeVarDecl(stmt);
                break;
            case "FunctionDeclStatement":
                await this.executeFunctionDecl(stmt);
                break;
            case "ReturnStatement":
                await this.executeReturn(stmt);
                break;
            case "IfStatement":
                await this.executeIf(stmt);
                break;
            case "WhileStatement":
                await this.executeWhile(stmt);
                break;
            case "ForStatement":
                await this.executeFor(stmt);
                break;
            case "ClassDeclStatement":
                await this.executeClassDecl(stmt);
                break;
            case "TryCatchStatement":
                await this.executeTryCatch(stmt);
                break;
            case "ExpressionStatement":
                await this.evaluate(stmt.expression);
                break;
            default:
                throw new Error(`[Runtime Error] Unknown statement type: ${stmt.type}`);
        }
    }
    async executePrint(stmt) {
        const value = await this.evaluate(stmt.expression);
        this.io.print(this.stringify(value) + "\n");
    }
    async executeVarDecl(stmt) {
        const value = await this.evaluate(stmt.expression);
        this.environment.define(stmt.name, value);
    }
    async executeFunctionDecl(stmt) {
        const fn = new UserFunction(stmt, this.environment);
        this.environment.define(stmt.name, fn);
    }
    async executeClassDecl(stmt) {
        const klass = new ClassCallable(stmt);
        this.environment.define(stmt.name, klass);
    }
    async executeTryCatch(stmt) {
        try {
            await this.executeBlock(stmt.tryBranch, new Environment(this.environment));
        }
        catch (err) {
            if (err instanceof ReturnException) {
                throw err;
            }
            if (stmt.catchBranch) {
                const catchEnv = new Environment(this.environment);
                if (stmt.catchVar) {
                    catchEnv.define(stmt.catchVar, err.message || err);
                }
                await this.executeBlock(stmt.catchBranch, catchEnv);
            }
            else {
                throw err;
            }
        }
        finally {
            if (stmt.finallyBranch) {
                await this.executeBlock(stmt.finallyBranch, new Environment(this.environment));
            }
        }
    }
    isInsideClassContext(instance) {
        let env = this.environment;
        while (env !== null) {
            if (env.getVariables().has("this")) {
                try {
                    const thisVal = env.get("this", 0);
                    if (thisVal === instance) {
                        return true;
                    }
                }
                catch (e) { }
            }
            env = env.getOuter();
        }
        return false;
    }
    async executeReturn(stmt) {
        let value = null;
        if (stmt.value) {
            value = await this.evaluate(stmt.value);
        }
        throw new ReturnException(value);
    }
    async executeIf(stmt) {
        const condition = await this.evaluate(stmt.condition);
        if (this.isTruthy(condition)) {
            await this.executeBlock(stmt.thenBranch, new Environment(this.environment));
        }
        else if (stmt.elseBranch) {
            await this.executeBlock(stmt.elseBranch, new Environment(this.environment));
        }
    }
    async executeWhile(stmt) {
        while (this.isTruthy(await this.evaluate(stmt.condition))) {
            await this.executeBlock(stmt.body, new Environment(this.environment));
        }
    }
    async executeFor(stmt) {
        const iteratorVal = await this.evaluate(stmt.iterator);
        if (!Array.isArray(iteratorVal)) {
            throw new Error(`[Runtime Error] Can only iterate over lists at line ${stmt.line}.`);
        }
        for (const val of iteratorVal) {
            const loopEnv = new Environment(this.environment);
            loopEnv.define(stmt.item, val);
            await this.executeBlock(stmt.body, loopEnv);
        }
    }
    async executeBlock(statements, env) {
        const previousEnv = this.environment;
        try {
            this.environment = env;
            for (const statement of statements) {
                await this.execute(statement);
            }
        }
        finally {
            this.environment = previousEnv;
        }
    }
    // --- Expression Evaluation ---
    async evaluate(expr) {
        switch (expr.type) {
            case "LiteralExpression":
                return expr.value;
            case "VariableExpression":
                return this.environment.get(expr.name, expr.line);
            case "BinaryExpression":
                return this.evaluateBinary(expr);
            case "UnaryExpression":
                return this.evaluateUnary(expr);
            case "InputExpression":
                return this.evaluateInput(expr);
            case "AssignExpression":
                return this.evaluateAssign(expr);
            case "CallExpression":
                return this.evaluateCall(expr);
            case "GetExpression":
                return this.evaluateGet(expr);
            case "ListExpression":
                return this.evaluateList(expr);
            case "DictExpression":
                return this.evaluateDict(expr);
            default:
                throw new Error(`[Runtime Error] Unknown expression type: ${expr.type}`);
        }
    }
    async evaluateBinary(expr) {
        const left = await this.evaluate(expr.left);
        const right = await this.evaluate(expr.right);
        switch (expr.operator) {
            case "+":
                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }
                if (typeof left === "string" || typeof right === "string") {
                    return this.stringify(left) + this.stringify(right);
                }
                throw new Error(`[Runtime Error] Operands of '+' must be numbers or strings at line ${expr.line}.`);
            case "-":
                this.checkNumberOperands(expr.operator, left, right, expr.line);
                return left - right;
            case "*":
                this.checkNumberOperands(expr.operator, left, right, expr.line);
                return left * right;
            case "/":
                this.checkNumberOperands(expr.operator, left, right, expr.line);
                if (right === 0) {
                    throw new Error(`[Runtime Error] Division by zero at line ${expr.line}.`);
                }
                return left / right;
            case "%":
                this.checkNumberOperands(expr.operator, left, right, expr.line);
                return left % right;
            case ">":
                this.checkComparableOperands(expr.operator, left, right, expr.line);
                return left > right;
            case ">=":
                this.checkComparableOperands(expr.operator, left, right, expr.line);
                return left >= right;
            case "<":
                this.checkComparableOperands(expr.operator, left, right, expr.line);
                return left < right;
            case "<=":
                this.checkComparableOperands(expr.operator, left, right, expr.line);
                return left <= right;
            case "==":
                return left === right;
            case "!=":
                return left !== right;
            case "and":
                return this.isTruthy(left) ? right : left;
            case "or":
                return this.isTruthy(left) ? left : right;
            default:
                throw new Error(`[Runtime Error] Unknown operator '${expr.operator}' at line ${expr.line}.`);
        }
    }
    async evaluateUnary(expr) {
        const right = await this.evaluate(expr.right);
        switch (expr.operator) {
            case "-":
                this.checkNumberOperand(expr.operator, right, expr.line);
                return -right;
            case "+":
                this.checkNumberOperand(expr.operator, right, expr.line);
                return right;
            case "not":
                return !this.isTruthy(right);
            default:
                throw new Error(`[Runtime Error] Unknown unary operator '${expr.operator}' at line ${expr.line}.`);
        }
    }
    async evaluateInput(expr) {
        const promptValue = await this.evaluate(expr.prompt);
        const promptStr = this.stringify(promptValue);
        const inputVal = await this.io.input(promptStr);
        if (inputVal.trim() !== "" && !isNaN(Number(inputVal))) {
            return Number(inputVal);
        }
        return inputVal;
    }
    async evaluateAssign(expr) {
        const value = await this.evaluate(expr.value);
        const target = expr.name;
        if (target.type === "VariableExpression") {
            this.environment.assign(target.name, value, expr.line);
        }
        else if (target.type === "GetExpression") {
            const obj = await this.evaluate(target.object);
            if (obj === null || obj === undefined || typeof obj !== "object") {
                throw new Error(`[Runtime Error] Can only assign properties of objects or arrays at line ${expr.line}.`);
            }
            let propKey;
            if (target.isComputed) {
                propKey = await this.evaluate(target.property);
            }
            else {
                propKey = target.property.value;
            }
            if (obj instanceof ClassInstance) {
                obj.fields.set(propKey, value);
            }
            else {
                obj[propKey] = value;
            }
        }
        else {
            throw new Error(`[Runtime Error] Invalid assignment target at line ${expr.line}.`);
        }
        return value;
    }
    async evaluateCall(expr) {
        const callee = await this.evaluate(expr.callee);
        const args = [];
        for (const arg of expr.args) {
            args.push(await this.evaluate(arg));
        }
        if (callee === null || typeof callee !== "object" || !("call" in callee)) {
            throw new Error(`[Runtime Error] Can only call functions and classes at line ${expr.line}.`);
        }
        const callable = callee;
        if (args.length !== callable.arity()) {
            throw new Error(`[Runtime Error] Expected ${callable.arity()} arguments but got ${args.length} at line ${expr.line}.`);
        }
        return await callable.call(this, args);
    }
    async evaluateGet(expr) {
        const obj = await this.evaluate(expr.object);
        if (obj === null || obj === undefined) {
            throw new Error(`[Runtime Error] Cannot read property of null/undefined at line ${expr.line}.`);
        }
        let propKey;
        if (expr.isComputed) {
            propKey = await this.evaluate(expr.property);
        }
        else {
            propKey = expr.property.value;
        }
        if (obj instanceof ClassInstance) {
            let method = obj.klass.declaration.methods.find(m => m.name === propKey);
            let currentClass = obj.klass;
            while (!method && currentClass.declaration.parent) {
                const parentName = currentClass.declaration.parent;
                const parentClass = this.globals.get(parentName, expr.line);
                if (parentClass instanceof ClassCallable) {
                    method = parentClass.declaration.methods.find(m => m.name === propKey);
                    currentClass = parentClass;
                }
                else {
                    break;
                }
            }
            if (method) {
                if (method.visibility === "private" || method.visibility === "protected") {
                    if (!this.isInsideClassContext(obj)) {
                        throw new Error(`[Runtime Error] Cannot access ${method.visibility} method '${propKey}' of class '${obj.klass.declaration.name}' from outside context at line ${expr.line}.`);
                    }
                }
                return new BoundMethod(obj, method);
            }
            return obj.fields.get(propKey);
        }
        const val = obj[propKey];
        if (typeof val === "function") {
            // Bind member methods to parent object context (e.g. string/array utility methods)
            return val.bind(obj);
        }
        return val;
    }
    async evaluateList(expr) {
        const list = [];
        for (const el of expr.elements) {
            list.push(await this.evaluate(el));
        }
        return list;
    }
    async evaluateDict(expr) {
        const dict = {};
        for (const prop of expr.properties) {
            dict[prop.key] = await this.evaluate(prop.value);
        }
        return dict;
    }
    // --- Helpers ---
    checkNumberOperand(operator, operand, line) {
        if (typeof operand === "number")
            return;
        throw new Error(`[Runtime Error] Operand of '${operator}' must be a number at line ${line}.`);
    }
    checkNumberOperands(operator, left, right, line) {
        if (typeof left === "number" && typeof right === "number")
            return;
        throw new Error(`[Runtime Error] Operands of '${operator}' must be numbers at line ${line}.`);
    }
    checkComparableOperands(operator, left, right, line) {
        if (typeof left === "number" && typeof right === "number")
            return;
        if (typeof left === "string" && typeof right === "string")
            return;
        throw new Error(`[Runtime Error] Operands of '${operator}' must be both numbers or both strings at line ${line}.`);
    }
    isTruthy(val) {
        if (val === null || val === undefined)
            return false;
        if (typeof val === "boolean")
            return val;
        return true;
    }
    stringify(val) {
        if (val === null)
            return "null";
        if (typeof val === "boolean")
            return val ? "true" : "false";
        if (typeof val === "object") {
            if (val instanceof UserFunction || val instanceof BuiltinFunction) {
                return `<function>`;
            }
            if (val instanceof ClassInstance) {
                return val.toString();
            }
            if (val instanceof ClassCallable) {
                return `<class ${val.declaration.name}>`;
            }
            if (val instanceof BoundMethod) {
                return `<method>`;
            }
            return JSON.stringify(val);
        }
        return String(val);
    }
}
exports.Interpreter = Interpreter;
