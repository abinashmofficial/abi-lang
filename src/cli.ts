#!/usr/bin/env node
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
  console.log(" File extension: .abx | Named after Abinash");
  console.log(" Type 'exit' or press Ctrl+C to quit. ");
  console.log("=========================================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = () => {
    rl.question("abx> ", async (line) => {
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

async function exportFramework(filePath: string, framework: string, outPath?: string) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found '${filePath}'`);
    process.exit(1);
  }
  const source = fs.readFileSync(absolutePath, "utf-8");
  const target = framework.toLowerCase();
  const componentName = path.basename(filePath, path.extname(filePath));
  const PascalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

  let scriptContent = "";
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    scriptContent = scriptMatch[1].trim();
  }

  let htmlBody = source.replace(/<script>([\s\S]*?)<\/script>/gi, "").trim();
  htmlBody = htmlBody.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, "{$1}");

  let output = "";
  let ext = "jsx";
  if (target === "react" || target === "next") {
    const hasHooks = /use[A-Z]\w+/.test(scriptContent);
    const reactImports = hasHooks ? "import React, { useState, useEffect } from 'react';" : "import React from 'react';";
    output = `${reactImports}\n\nexport default function ${PascalName}() {\n  ${scriptContent.split('\n').join('\n  ')}\n\n  return (\n    <div>\n      ${htmlBody.split('\n').join('\n      ')}\n    </div>\n  );\n}\n`;
  } else if (target === "vue") {
    ext = "vue";
    output = `<template>\n  <div>\n    ${htmlBody}\n  </div>\n</template>\n\n<script>\n${scriptContent}\n</script>\n`;
  } else if (target === "svelte") {
    ext = "svelte";
    output = `<script>\n${scriptContent}\n</script>\n\n<div>\n  ${htmlBody}\n</div>\n`;
  } else if (target === "solid") {
    output = `import { createSignal, createEffect } from 'solid-js';\n\nexport default function ${PascalName}() {\n  ${scriptContent.split('\n').join('\n  ')}\n\n  return <div>${htmlBody}</div>;\n}\n`;
  } else if (target === "angular") {
    ext = "ts";
    output = `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-${componentName.toLowerCase()}',\n  template: \`<div>${htmlBody}</div>\`\n})\nexport class ${PascalName}Component {\n  ${scriptContent.split('\n').join('\n  ')}\n}\n`;
  } else if (target === "webcomponent" || target === "wc") {
    ext = "js";
    output = `class ${PascalName}Element extends HTMLElement {\n  connectedCallback() {\n    ${scriptContent.split('\n').join('\n    ')}\n    this.innerHTML = \`<div>${htmlBody}</div>\`;\n  }\n}\ncustomElements.define('abi-${componentName.toLowerCase()}', ${PascalName}Element);\n`;
  } else if (target === "react-native" || target === "rn") {
    output = `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function ${PascalName}() {\n  ${scriptContent.split('\n').join('\n  ')}\n\n  return (\n    <View>\n      <Text>${htmlBody}</Text>\n    </View>\n  );\n}\n`;
  } else if (target === "astro") {
    ext = "astro";
    output = `---\n// ${PascalName}.astro - Compiled from ${path.basename(filePath)}\n${scriptContent}\n---\n<div>\n  ${htmlBody}\n</div>\n`;
  } else if (target === "qwik") {
    ext = "tsx";
    output = `import { component$ } from '@builder.io/qwik';\n\nexport default component$(() => {\n  ${scriptContent.split('\n').join('\n  ')}\n  return <div>${htmlBody}</div>;\n});\n`;
  } else if (target === "ts-types" || target === "dts") {
    ext = "d.ts";
    output = `export interface ${PascalName}Props {\n  [key: string]: any;\n}\nexport declare const ${PascalName}: React.FC<${PascalName}Props>;\n`;
  } else {
    console.error(`Error: Unsupported framework target '${framework}'`);
    process.exit(1);
  }

  const destination = outPath ? path.resolve(outPath) : path.resolve(`${componentName}.${ext}`);
  fs.writeFileSync(destination, output);
  console.log(`Successfully exported ${filePath} to ${target.toUpperCase()} target -> ${destination}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    if (args[0] === "-h" || args[0] === "--help") {
      console.log("Usage:");
      console.log("  abi                               Start interactive REPL");
      console.log("  abi <file.abx>                    Run an AbiLang script file");
      console.log("  abi build <file.abx> --target <framework> Export component to framework");
      console.log("  Supported frameworks: react, vue, angular, svelte, solid, next");
      process.exit(0);
    }
    if (args[0] === "build" && args[1]) {
      const targetIdx = args.indexOf("--target");
      const framework = targetIdx !== -1 && args[targetIdx + 1] ? args[targetIdx + 1] : "react";
      await exportFramework(args[1], framework);
      return;
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
