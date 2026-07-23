const fs = require('fs');
const path = require('path');
const os = require('os');

function resolvePath(p) {
    if (p.startsWith('~')) {
        return path.join(os.homedir(), p.slice(1));
    }
    return p.replace(/%([^%]+)%/g, (_, name) => process.env[name] || '');
}

const abilangTmGrammar = {
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "AbiLang",
  "patterns": [
    { "include": "#comments" },
    { "include": "#class-declarations" },
    { "include": "#function-declarations" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#operators" },
    { "include": "#keywords" },
    { "include": "#identifiers" }
  ],
  "repository": {
    "comments": {
      "patterns": [
        { "name": "comment.line.double-slash.abi", "match": "//.*$" },
        { "name": "comment.line.number-sign.abi",  "match": "#.*$" }
      ]
    },
    "class-declarations": {
      "patterns": [
        {
          "match": "\\b(class)\\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\\s+(extends)\\s+([a-zA-Z_][a-zA-Z0-9_]*))?",
          "captures": {
            "1": { "name": "storage.type.class.abi" },
            "2": { "name": "entity.name.type.class.abi" },
            "3": { "name": "keyword.control.abi" },
            "4": { "name": "entity.name.type.inherited-class.abi" }
          }
        }
      ]
    },
    "function-declarations": {
      "patterns": [
        {
          "match": "\\b(func)\\s+([a-zA-Z_][a-zA-Z0-9_]*)",
          "captures": {
            "1": { "name": "storage.type.function.abi" },
            "2": { "name": "entity.name.function.abi" }
          }
        }
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
          "name": "string.quoted.other.template.abi",
          "begin": "`",
          "end": "`",
          "patterns": [{ "name": "constant.character.escape.abi", "match": "\\\\." }]
        }
      ]
    },
    "numbers": {
      "patterns": [
        { "name": "constant.numeric.decimal.abi", "match": "\\b\\d+(\\.\\d+)?\\b" }
      ]
    },
    "operators": {
      "patterns": [
        { "name": "keyword.operator.comparison.abi", "match": "(==|!=|<=|>=|<|>)" },
        { "name": "keyword.operator.assignment.abi",  "match": "(?<![=!<>])=(?!=)" },
        { "name": "keyword.operator.arithmetic.abi",  "match": "(\\+|-|\\*|/|%)" }
      ]
    },
    "keywords": {
      "patterns": [
        {
          "name": "keyword.control.abi",
          "match": "\\b(if|else|while|for|in|return|try|catch|finally|import|export|from|implements|extends|extents)\\b"
        },
        {
          "name": "storage.type.abi",
          "match": "\\b(class|func)\\b"
        },
        {
          "name": "storage.modifier.abi",
          "match": "\\b(public|private|protected)\\b"
        },
        {
          "name": "keyword.declaration.abi",
          "match": "\\b(const|let|var|interface|new|async|await|throw)\\b"
        },
        {
          "name": "support.function.builtin.abi",
          "match": "\\b(print|input|db_connect|db_create|db_update|db_delete|db_fetch|dd|include|route|screen|env)\\b"
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
        { "name": "entity.name.function.abi",      "match": "\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*\\()" },
        { "name": "entity.name.type.class.abi",    "match": "\\b[A-Z][a-zA-Z0-9_]*\\b" },
        { "name": "variable.other.readwrite.abi",  "match": "\\b[a-zA-Z_][a-zA-Z0-9_]*\\b" }
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
      "name": "meta.keyword.load.abiui",
      "match": "\\b(?:(export)\\s+)?(load|import|inject|render)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s+(from)\\s+(\"[^\"]*\"|'[^']*')",
      "captures": {
        "1": { "name": "keyword.control.import.abiui" },
        "2": { "name": "keyword.control.import.abiui" },
        "3": { "name": "entity.name.type.class.abiui" },
        "4": { "name": "keyword.control.import.abiui" },
        "5": { "name": "string.quoted.double.abiui" }
      }
    },
    {
      "name": "keyword.control.component.abiui",
      "match": "\\b(component)\\b"
    },
    {
      "begin": "<script\\s+setup>",
      "beginCaptures": { "0": { "name": "punctuation.definition.tag.begin.html" } },
      "end": "</script>",
      "endCaptures": { "0": { "name": "punctuation.definition.tag.end.html" } },
      "name": "meta.embedded.block.html",
      "contentName": "source.js",
      "patterns": [{ "include": "source.js" }]
    },
    {
      "begin": "\\{\\{",
      "beginCaptures": { "0": { "name": "punctuation.section.embedded.begin.abiui" } },
      "end": "\\}\\}",
      "endCaptures": { "0": { "name": "punctuation.section.embedded.end.abiui" } },
      "name": "meta.embedded.expression.abiui",
      "contentName": "source.js",
      "patterns": [{ "include": "source.js" }]
    },
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
  "description": "Syntax highlighting support for AbiLang (.abi) and AbiLang UI templates (.ui and .abx)",
  "version": "1.0.0",
  "publisher": "abinashm",
  "engines": { "vscode": "^1.0.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [
      {
        "id": "abilang",
        "aliases": ["AbiLang", "abilang"],
        "extensions": [".abi", ".ab", ".abilang"],
        "configuration": "./language-configuration.json"
      },
      {
        "id": "abilangui",
        "aliases": ["AbiLang UI", "abilangui"],
        "extensions": [".ui", ".abx"],
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

syn keyword abiKeyword print input return if else while for in and or not import export from const let interface implements extends extents new async await throw try catch finally this db_connect db_create db_update db_delete db_fetch dd
syn keyword abiStorage class func
syn keyword abiModifier public private protected
syn keyword abiConstant true false null
syn match abiClass "\\b[A-Z][a-zA-Z0-9_]*\\b"
syn match abiNumber "\\b\\d\\+\\(\\.\\d\\+\\)\\?\\b"
syn region abiString start='"' end='"' contains=abiEscape
syn region abiString start="'" end="'" contains=abiEscape
syn region abiString start="\`" end="\`" contains=abiEscape
syn match abiEscape "\\\\." contained
syn match abiComment "#.*"
syn match abiComment "//.*"

hi def link abiKeyword Keyword
hi def link abiStorage StorageClass
hi def link abiModifier StorageClass
hi def link abiConstant Constant
hi def link abiClass Type
hi def link abiNumber Number
hi def link abiString String
hi def link abiEscape Special
hi def link abiComment Comment

let b:current_syntax = "abi"
`;

const vimAbiDetect = `au BufRead,BufNewFile *.abi,*.ab,*.abilang set filetype=abi
`;

const vimUiSyntax = `if exists("b:current_syntax")
  finish
endif

runtime! syntax/html.vim
unlet b:current_syntax

syn keyword uiKeyword component load import inject render export from
syn match uiDirective "@include\\s*([^\\)]*)"
syn match uiDirective "@plugin\\s*([^\\)]*)"
syn region uiScriptBlock start="<script\\s\\+setup>" end="</script>" contains=@htmlJavaScript
syn region uiExprBlock start="{{" end="}}" contains=@htmlJavaScript
syn region uiCodeBlock start="<%" end="%>" contains=@htmlJavaScript

hi def link uiKeyword Keyword
hi def link uiDirective PreProc
hi def link uiScriptBlock Special
hi def link uiExprBlock Special
hi def link uiCodeBlock Special

let b:current_syntax = "ui"
`;

const vimUiDetect = `au BufRead,BufNewFile *.ui,*.abx set filetype=ui
`;

const sublimeAbiSyntax = `%YAML 1.2
---
name: AbiLang
file_extensions: [abi, ab, abilang]
scope: source.abi

contexts:
  main:
    - match: '#.*|//.*'
      scope: comment.line.abi
    - match: '\\b(class)\\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\\s+(extends)\\s+([a-zA-Z_][a-zA-Z0-9_]*))?'
      captures:
        1: storage.type.class.abi
        2: entity.name.type.class.abi
        3: keyword.control.abi
        4: entity.other.inherited-class.abi
    - match: '\\b(func)\\s+([a-zA-Z_][a-zA-Z0-9_]*)'
      captures:
        1: storage.type.function.abi
        2: entity.name.function.abi
    - match: '\\b(public|private|protected)\\b'
      scope: storage.modifier.abi
    - match: '\\b(print|input|return|if|else|while|for|in|and|or|not|import|export|from|const|let|interface|implements|extends|extents|new|async|await|throw|try|catch|finally|db_connect|db_create|db_update|db_delete|db_fetch|dd)\\b'
      scope: keyword.control.abi
    - match: '\\b[A-Z][a-zA-Z0-9_]*\\b'
      scope: entity.name.type.class.abi
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
file_extensions: [abx]
scope: text.html.abilangui

contexts:
  main:
    - match: '\\b(load|import|inject|render)\\b'
      scope: keyword.control.import.abiui
    - match: '\\b(from)\\b'
      scope: keyword.control.import.abiui
    - match: '\\b(export)\\b'
      scope: keyword.control.import.abiui
    - match: '\\b(component)\\b'
      scope: keyword.control.component.abiui
    - match: '<script\\s+setup>'
      scope: punctuation.section.embedded.begin.abiui
      push: embedded_js_script
    - match: '\\{\\{'
      scope: punctuation.section.embedded.begin.abiui
      push: embedded_js_expression
    - match: '@include\\s*\\(\\s*["''][^"'']*["'']\\s*\\)'
      scope: keyword.control.directive.abiui
    - match: '@plugin\\s*\\(\\s*["''][^"'']*["''](?:,\\s*["''][^"'']*["''])*(?:,\\s*[^)]*)?\\)'
      scope: keyword.control.directive.abiui
    - match: '<%'
      scope: punctuation.section.embedded.begin.abiui
      push: embedded_js
    - match: ''
      push: scope:text.html.basic

  embedded_js_script:
    - meta_scope: source.js.embedded.abiui
    - match: '</script>'
      scope: punctuation.section.embedded.end.abiui
      pop: true
    - match: ''
      push: scope:source.js

  embedded_js_expression:
    - meta_scope: source.js.embedded.abiui
    - match: '\\}\\}'
      scope: punctuation.section.embedded.end.abiui
      pop: true
    - match: ''
      push: scope:source.js

  embedded_js:
    - meta_scope: source.js.embedded.abiui
    - match: '%>'
      scope: punctuation.section.embedded.end.abiui
      pop: true
      push: scope:source.js
`;

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

console.log('\nInstalling syntax support globally on the local system...');

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

const vscodeInsidersDest = process.platform === 'win32'
    ? resolvePath('%USERPROFILE%\\.vscode-insiders\\extensions\\abilang-support')
    : resolvePath('~/.vscode-insiders/extensions/abilang-support');

try {
    fs.mkdirSync(path.join(vscodeInsidersDest, 'syntaxes'), { recursive: true });
    fs.writeFileSync(path.join(vscodeInsidersDest, 'package.json'), JSON.stringify(vscodePackageJson, null, 2));
    fs.writeFileSync(path.join(vscodeInsidersDest, 'language-configuration.json'), JSON.stringify(vscodeLangConfig, null, 2));
    fs.writeFileSync(path.join(vscodeInsidersDest, 'ui-language-configuration.json'), JSON.stringify(vscodeUiLangConfig, null, 2));
    fs.writeFileSync(path.join(vscodeInsidersDest, 'syntaxes/abilang.tmLanguage.json'), JSON.stringify(abilangTmGrammar, null, 2));
    fs.writeFileSync(path.join(vscodeInsidersDest, 'syntaxes/abilangui.tmLanguage.json'), JSON.stringify(abilangUiTmGrammar, null, 2));
    console.log(`✓ VS Code Insiders Extension installed: ${vscodeInsidersDest}`);
} catch (e) {
    console.warn(`! Failed to install VS Code Insiders extension: ${e.message}`);
}

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
