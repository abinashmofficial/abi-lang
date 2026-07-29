"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const interpreter_1 = require("./interpreter");
class CliIOHandler {
    print(message) {
        process.stdout.write(message);
    }
    input(prompt) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }
}
async function runFile(filePath) {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found '${filePath}'`);
        process.exit(1);
    }
    const source = fs.readFileSync(absolutePath, "utf-8");
    const io = new CliIOHandler();
    const lexer = new lexer_1.Lexer(source);
    try {
        const tokens = lexer.tokenize();
        const parser = new parser_1.Parser(tokens);
        const statements = parser.parse();
        const interpreter = new interpreter_1.Interpreter(io);
        await interpreter.interpret(statements);
    }
    catch (err) {
        process.exit(1);
    }
}
async function runRepl() {
    const io = new CliIOHandler();
    const interpreter = new interpreter_1.Interpreter(io);
    console.log("=========================================");
    console.log(" Welcome to AbiLang CLI REPL (v1.0.0) ");
    console.log(" File extension: .abi | Named after Abinash");
    console.log(" Type 'exit' or press Ctrl+C to quit. ");
    console.log("=========================================\n");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const prompt = () => {
        rl.question("abi> ", async (line) => {
            if (line.trim() === "exit") {
                rl.close();
                return;
            }
            if (line.trim() !== "") {
                try {
                    const lexer = new lexer_1.Lexer(line);
                    const tokens = lexer.tokenize();
                    const parser = new parser_1.Parser(tokens);
                    const statements = parser.parse();
                    await interpreter.interpret(statements);
                }
                catch (err) {
                    // Error output is already printed by interpreter.interpret
                }
            }
            prompt();
        });
    };
    prompt();
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        if (args[0] === "-h" || args[0] === "--help") {
            console.log("Usage:");
            console.log("  abi                    Start the interactive REPL");
            console.log("  abi <file.abi>         Run an AbiLang script file");
            process.exit(0);
        }
        await runFile(args[0]);
    }
    else {
        await runRepl();
    }
}
main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
