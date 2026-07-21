import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, IOHandler } from "./interpreter";

class CliIOHandler implements IOHandler {
  print(message: string): void {
    process.stdout.write(message);
  }

  input(prompt: string): Promise<string> {
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

async function runFile(filePath: string) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found '${filePath}'`);
    process.exit(1);
  }

  const source = fs.readFileSync(absolutePath, "utf-8");
  const io = new CliIOHandler();
  const lexer = new Lexer(source);
  
  try {
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const statements = parser.parse();
    const interpreter = new Interpreter(io);
    await interpreter.interpret(statements);
  } catch (err: any) {
    process.exit(1);
  }
}

async function runRepl() {
  const io = new CliIOHandler();
  const interpreter = new Interpreter(io);
  
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
          const lexer = new Lexer(line);
          const tokens = lexer.tokenize();
          const parser = new Parser(tokens);
          const statements = parser.parse();
          await interpreter.interpret(statements);
        } catch (err: any) {
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
  } else {
    await runRepl();
  }
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
