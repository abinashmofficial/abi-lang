const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to expand environment variables or tilde in paths
function resolvePath(p) {
    if (p.startsWith('~')) {
        return path.join(os.homedir(), p.slice(1));
    }
    // Resolve Windows env vars
    return p.replace(/%([^%]+)%/g, (_, name) => process.env[name] || '');
}

// 1. Define Grammar File Contents
const abilangTmGrammar = {
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "AbiLang",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#keywords" },
    { "include": "#identifiers" }
  ],
  "repository": {
    "comments": {
      "patterns": [
        { "name": "comment.line.double-slash.abi", "match": "//.*" },
        { "name": "comment.line.number-sign.abi", "match": "#.*" }
      ]
    },
    "strings": {
      "patterns": [
        {
          "name": "string.quoted.double.abi",
          "begin": "\"",
          "end": "\"",
          "patterns": [{ "name": "constant.character.escape.abi", "match": "\\\\." }]
        },
        {
          "name": "string.quoted.single.abi",
          "begin": "'",
          "end": "'",
          "patterns": [{ "name": "constant.character.escape.abi", "match": "\\\\." }]
        },
        {
          "name": "string.quoted.template.abi",
          "begin": "`",
          "end": "`",
          "patterns": [{ "name": "constant.character.escape.abi", "match": "\\\\." }]
        }
      ]
    },
    "numbers": {
      "patterns": [
        { "name": "constant.numeric.abi", "match": "\\b\\d+(\\.\\d+)?\\b" }
      ]
    },
    "keywords": {
      "patterns": [
        {
          "name": "keyword.control.abi",
          "match": "\\b(if|else|while|return|for|in|try|catch|finally|import|export|from|implements|extends)\\b"
        },
        {
          "name": "keyword.declaration.abi",
          "match": "\\b(func|class|const|let|interface|var|new|async|await|throw)\\b"
        },
        {
          "name": "storage.modifier.abi",
          "match": "\\b(public|private|protected)\\b"
        },
        {
          "name": "keyword.other.abi",
          "match": "\\b(print|input)\\b"
        },
        {
          "name": "constant.language.boolean.abi",
          "match": "\\b(true|false)\\b"
        },
        {
          "name": "constant.language.null.abi",
          "match": "\\bnull\\b"
        },
        {
          "name": "keyword.operator.logical.abi",
          "match": "\\b(and|or|not)\\b"
        },
        {
          "name": "variable.language.this.abi",
          "match": "\\bthis\\b"
        }
      ]
    },
    "identifiers": {
      "patterns": [
        { "name": "entity.name.function.abi", "match": "\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*\\()" },
        { "name": "entity.name.type.class.abi", "match": "\\b[A-Z][a-zA-Z0-9_]*\\b" }
      ]
    }
  },
  "scopeName": "source.abi"
};

const abilangUiTmGrammar = {
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "AbiLang UI",
  "patterns": [
    {
      "name": "keyword.control.directive.abiui",
      "match": "@include\\s*\\(\\s*\"[^\"]*\"\\s*\\)|@include\\s*\\(\\s*'[^']*'\\s*\\)"
    },
    {
      "name": "keyword.control.directive.abiui",
      "match": "@plugin\\s*\\(\\s*\"[^\"]*\"(?:,\\s*\"[^\"]*\")*(?:,\\s*[^)]*)?\\)"
    },
    {
      "name": "comment.block.abiui",
      "begin": "<%--",
      "end": "--%>"
    },
    {
      "begin": "<%(=)?",
      "beginCaptures": { "0": { "name": "punctuation.section.embedded.begin.abiui" } },
      "end": "%>",
      "endCaptures": { "0": { "name": "punctuation.section.embedded.end.abiui" } },
      "name": "meta.embedded.block.abiui",
      "contentName": "source.js",
      "patterns": [{ "include": "source.js" }]
    },
    { "include": "text.html.basic" }
  ],
  "scopeName": "text.html.abilangui"
};

const vscodePackageJson = {
  "name": "abilang-support",
  "displayName": "AbiLang Support",
  "description": "Syntax highlighting support for AbiLang (.abi) and AbiLang UI templates (.ui)",
  "version": "1.0.0",
  "publisher": "abinashm",
  "engines": { "vscode": "^1.0.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [
      {
        "id": "abilang",
        "aliases": ["AbiLang", "abilang"],
        "extensions": [".abi"],
        "configuration": "./language-configuration.json"
      },
      {
        "id": "abilangui",
        "aliases": ["AbiLang UI", "abilangui"],
        "extensions": [".ui"],
        "configuration": "./ui-language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "abilang",
        "scopeName": "source.abi",
        "path": "./syntaxes/abilang.tmLanguage.json"
      },
      {
        "language": "abilangui",
        "scopeName": "text.html.abilangui",
        "path": "./syntaxes/abilangui.tmLanguage.json"
      }
    ]
  }
};

const vscodeLangConfig = {
  "comments": { "lineComment": "#" },
  "brackets": [["{", "}"], ["[", "]"], ["(", ")"]],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"" },
    { "open": "'", "close": "'" },
    { "open": "`", "close": "`" }
  ],
  "surroundingPairs": [
    ["{", "}"], ["[", "]"], ["(", ")"], ["\"", "\""], ["'", "'"], ["`", "`"]
  ]
};

const vscodeUiLangConfig = {
  "comments": { "blockComment": ["<!--", "-->"] },
  "brackets": [["{", "}"], ["[", "]"], ["(", ")"]],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"" },
    { "open": "'", "close": "'" }
  ]
};

const vimAbiSyntax = `if exists("b:current_syntax")
  finish
endif

syn keyword abiKeyword class func print input return if else while for in and or not public private protected import export from const let interface implements extends new async await throw try catch finally this
syn keyword abiConstant true false null
syn match abiNumber "\\b\\d\\+\\(\\.\\d\\+\\)\\?\\b"
syn region abiString start='"' end='"' contains=abiEscape
syn region abiString start="'" end="'" contains=abiEscape
syn region abiString start="\`" end="\`" contains=abiEscape
syn match abiEscape "\\\\." contained
syn match abiComment "#.*"
syn match abiComment "//.*"

hi def link abiKeyword Keyword
hi def link abiConstant Constant
hi def link abiNumber Number
hi def link abiString String
hi def link abiEscape Special
hi def link abiComment Comment

let b:current_syntax = "abi"
`;

const vimAbiDetect = `au BufRead,BufNewFile *.abi set filetype=abi
`;

const vimUiSyntax = `if exists("b:current_syntax")
  finish
endif

runtime! syntax/html.vim
unlet b:current_syntax

syn match uiDirective "@include\\s*([^\\)]*)"
syn match uiDirective "@plugin\\s*([^\\)]*)"
syn region uiCodeBlock start="<%" end="%>" contains=@htmlJavaScript

hi def link uiDirective PreProc
hi def link uiCodeBlock Special

let b:current_syntax = "ui"
`;

const vimUiDetect = `au BufRead,BufNewFile *.ui set filetype=ui
`;

const sublimeAbiSyntax = `%YAML 1.2
---
name: AbiLang
file_extensions: [abi]
scope: source.abi

contexts:
  main:
    - match: '#.*|//.*'
      scope: comment.line.abi
    - match: '\\b(class|func|print|input|return|if|else|while|for|in|and|or|not|public|private|protected|import|export|from|const|let|interface|implements|extends|new|async|await|throw|try|catch|finally)\\b'
      scope: keyword.control.abi
    - match: '\\b(true|false|null)\\b'
      scope: constant.language.abi
    - match: '\\bthis\\b'
      scope: variable.language.this.abi
    - match: '\\b\\d+(\\.\\d+)?\\b'
      scope: constant.numeric.abi
    - match: '"'
      scope: punctuation.definition.string.begin.abi
      push: string_double
    - match: "'"
      scope: punctuation.definition.string.begin.abi
      push: string_single

  string_double:
    - meta_scope: string.quoted.double.abi
    - match: '\\\\.'
      scope: constant.character.escape.abi
    - match: '"'
      scope: punctuation.definition.string.end.abi
      pop: true

  string_single:
    - meta_scope: string.quoted.single.abi
    - match: '\\\\.'
      scope: constant.character.escape.abi
    - match: "'"
      scope: punctuation.definition.string.end.abi
      pop: true
`;

const sublimeUiSyntax = `%YAML 1.2
---
name: AbiLang UI
file_extensions: [ui]
scope: text.html.abilangui

contexts:
  main:
    - match: '@include\\s*\\(\\s*["''][^"'']*["'']\\s*\\)'
      scope: keyword.control.directive.abiui
    - match: '@plugin\\s*\\(\\s*["''][^"'']*["''](?:,\\s*["''][^"'']*["''])*(?:,\\s*[^)]*)?\\)'
      scope: keyword.control.directive.abiui
    - match: '<%'
      scope: punctuation.section.embedded.begin.abiui
      push: embedded_js
    - match: ''
      push: scope:text.html.basic

  embedded_js:
    - meta_scope: source.js.embedded.abiui
    - match: '%>'
      scope: punctuation.section.embedded.end.abiui
      pop: true
    - match: ''
      push: scope:source.js
`;

// 2. Generate Local Files in the Project (ide-syntax/)
const localDir = path.join(__dirname, '../ide-syntax');
console.log(`Writing local syntax files to ${localDir}...`);

fs.mkdirSync(path.join(localDir, 'vscode/syntaxes'), { recursive: true });
fs.mkdirSync(path.join(localDir, 'vim/syntax'), { recursive: true });
fs.mkdirSync(path.join(localDir, 'vim/ftdetect'), { recursive: true });
fs.mkdirSync(path.join(localDir, 'sublime'), { recursive: true });

fs.writeFileSync(path.join(localDir, 'vscode/package.json'), JSON.stringify(vscodePackageJson, null, 2));
fs.writeFileSync(path.join(localDir, 'vscode/language-configuration.json'), JSON.stringify(vscodeLangConfig, null, 2));
fs.writeFileSync(path.join(localDir, 'vscode/ui-language-configuration.json'), JSON.stringify(vscodeUiLangConfig, null, 2));
fs.writeFileSync(path.join(localDir, 'vscode/syntaxes/abilang.tmLanguage.json'), JSON.stringify(abilangTmGrammar, null, 2));
fs.writeFileSync(path.join(localDir, 'vscode/syntaxes/abilangui.tmLanguage.json'), JSON.stringify(abilangUiTmGrammar, null, 2));

fs.writeFileSync(path.join(localDir, 'vim/syntax/abi.vim'), vimAbiSyntax);
fs.writeFileSync(path.join(localDir, 'vim/ftdetect/abi.vim'), vimAbiDetect);
fs.writeFileSync(path.join(localDir, 'vim/syntax/ui.vim'), vimUiSyntax);
fs.writeFileSync(path.join(localDir, 'vim/ftdetect/ui.vim'), vimUiDetect);

fs.writeFileSync(path.join(localDir, 'sublime/abi.sublime-syntax'), sublimeAbiSyntax);
fs.writeFileSync(path.join(localDir, 'sublime/ui.sublime-syntax'), sublimeUiSyntax);

// 3. Install Syntax Support Globally for Local User IDEs
console.log('\nInstalling syntax support globally on the local system...');

// --- VS Code Extension Installation ---
const vscodeDest = process.platform === 'win32'
    ? resolvePath('%USERPROFILE%\\.vscode\\extensions\\abilang-support')
    : resolvePath('~/.vscode/extensions/abilang-support');

try {
    fs.mkdirSync(path.join(vscodeDest, 'syntaxes'), { recursive: true });
    fs.writeFileSync(path.join(vscodeDest, 'package.json'), JSON.stringify(vscodePackageJson, null, 2));
    fs.writeFileSync(path.join(vscodeDest, 'language-configuration.json'), JSON.stringify(vscodeLangConfig, null, 2));
    fs.writeFileSync(path.join(vscodeDest, 'ui-language-configuration.json'), JSON.stringify(vscodeUiLangConfig, null, 2));
    fs.writeFileSync(path.join(vscodeDest, 'syntaxes/abilang.tmLanguage.json'), JSON.stringify(abilangTmGrammar, null, 2));
    fs.writeFileSync(path.join(vscodeDest, 'syntaxes/abilangui.tmLanguage.json'), JSON.stringify(abilangUiTmGrammar, null, 2));
    console.log(`✓ VS Code Extension installed: ${vscodeDest}`);
} catch (e) {
    console.warn(`! Failed to install VS Code extension: ${e.message}`);
}

// --- Vim/Neovim Installation ---
const vimDest = process.platform === 'win32'
    ? resolvePath('%USERPROFILE%\\vimfiles')
    : resolvePath('~/.vim');

try {
    fs.mkdirSync(path.join(vimDest, 'syntax'), { recursive: true });
    fs.mkdirSync(path.join(vimDest, 'ftdetect'), { recursive: true });
    fs.writeFileSync(path.join(vimDest, 'syntax/abi.vim'), vimAbiSyntax);
    fs.writeFileSync(path.join(vimDest, 'ftdetect/abi.vim'), vimAbiDetect);
    fs.writeFileSync(path.join(vimDest, 'syntax/ui.vim'), vimUiSyntax);
    fs.writeFileSync(path.join(vimDest, 'ftdetect/ui.vim'), vimUiDetect);
    console.log(`✓ Vim Syntax files installed: ${vimDest}`);
} catch (e) {
    console.warn(`! Failed to install Vim files: ${e.message}`);
}

// --- Sublime Text Installation ---
let sublimeDest = '';
if (process.platform === 'win32') {
    sublimeDest = resolvePath('%APPDATA%\\Sublime Text\\Packages\\User');
} else if (process.platform === 'darwin') {
    sublimeDest = resolvePath('~/Library/Application Support/Sublime Text/Packages/User');
} else {
    sublimeDest = resolvePath('~/.config/sublime-text/Packages/User');
    if (!fs.existsSync(sublimeDest)) {
        sublimeDest = resolvePath('~/.config/sublime-text-3/Packages/User');
    }
}

try {
    fs.mkdirSync(sublimeDest, { recursive: true });
    fs.writeFileSync(path.join(sublimeDest, 'abi.sublime-syntax'), sublimeAbiSyntax);
    fs.writeFileSync(path.join(sublimeDest, 'ui.sublime-syntax'), sublimeUiSyntax);
    console.log(`✓ Sublime Text Syntax files installed: ${sublimeDest}`);
} catch (e) {
    console.warn(`! Failed to install Sublime Text files: ${e.message}`);
}

console.log('\nSyntax setup completed successfully!');
