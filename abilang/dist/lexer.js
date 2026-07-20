"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const types_1 = require("./types");
class Lexer {
    source;
    position = 0;
    line = 1;
    column = 1;
    keywords = {
        print: types_1.TokenType.PRINT,
        input: types_1.TokenType.INPUT,
        if: types_1.TokenType.IF,
        else: types_1.TokenType.ELSE,
        while: types_1.TokenType.WHILE,
        func: types_1.TokenType.FUNC,
        return: types_1.TokenType.RETURN,
        for: types_1.TokenType.FOR,
        in: types_1.TokenType.IN,
        true: types_1.TokenType.BOOLEAN,
        false: types_1.TokenType.BOOLEAN,
        null: types_1.TokenType.NULL,
        and: types_1.TokenType.AND,
        or: types_1.TokenType.OR,
        not: types_1.TokenType.NOT,
        class: types_1.TokenType.CLASS,
        public: types_1.TokenType.PUBLIC,
        private: types_1.TokenType.PRIVATE,
        protected: types_1.TokenType.PROTECTED,
        extends: types_1.TokenType.EXTENDS,
        try: types_1.TokenType.TRY,
        catch: types_1.TokenType.CATCH,
        finally: types_1.TokenType.FINALLY,
    };
    constructor(source) {
        this.source = source.replace(/\r\n/g, "\n");
    }
    isAtEnd() {
        return this.position >= this.source.length;
    }
    peek() {
        if (this.isAtEnd())
            return "\0";
        return this.source[this.position];
    }
    peekNext() {
        if (this.position + 1 >= this.source.length)
            return "\0";
        return this.source[this.position + 1];
    }
    advance() {
        const char = this.source[this.position++];
        if (char === "\n") {
            this.line++;
            this.column = 1;
        }
        else {
            this.column++;
        }
        return char;
    }
    error(message) {
        throw new Error(`[Lexer Error] ${message} at line ${this.line}, column ${this.column}`);
    }
    tokenize() {
        const tokens = [];
        while (!this.isAtEnd()) {
            const startLine = this.line;
            const startColumn = this.column;
            const char = this.peek();
            // Skip whitespace
            if (/\s/.test(char)) {
                this.advance();
                continue;
            }
            // Handle comments
            if (char === "#" || (char === "/" && this.peekNext() === "/")) {
                while (!this.isAtEnd() && this.peek() !== "\n") {
                    this.advance();
                }
                continue;
            }
            // Numbers
            if (/[0-9]/.test(char)) {
                tokens.push(this.readNumber(startLine, startColumn));
                continue;
            }
            // Identifiers / Keywords
            if (/[a-zA-Z_]/.test(char)) {
                tokens.push(this.readIdentifier(startLine, startColumn));
                continue;
            }
            // Strings
            if (char === '"') {
                tokens.push(this.readString(startLine, startColumn));
                continue;
            }
            // Operators & Punctuations
            this.advance(); // consume the character
            switch (char) {
                case "(":
                    tokens.push({ type: types_1.TokenType.LPAREN, value: "(", line: startLine, column: startColumn });
                    break;
                case ")":
                    tokens.push({ type: types_1.TokenType.RPAREN, value: ")", line: startLine, column: startColumn });
                    break;
                case "{":
                    tokens.push({ type: types_1.TokenType.LBRACE, value: "{", line: startLine, column: startColumn });
                    break;
                case "}":
                    tokens.push({ type: types_1.TokenType.RBRACE, value: "}", line: startLine, column: startColumn });
                    break;
                case "[":
                    tokens.push({ type: types_1.TokenType.LBRACKET, value: "[", line: startLine, column: startColumn });
                    break;
                case "]":
                    tokens.push({ type: types_1.TokenType.RBRACKET, value: "]", line: startLine, column: startColumn });
                    break;
                case ":":
                    tokens.push({ type: types_1.TokenType.COLON, value: ":", line: startLine, column: startColumn });
                    break;
                case ".":
                    tokens.push({ type: types_1.TokenType.DOT, value: ".", line: startLine, column: startColumn });
                    break;
                case ",":
                    tokens.push({ type: types_1.TokenType.COMMA, value: ",", line: startLine, column: startColumn });
                    break;
                case "+":
                    tokens.push({ type: types_1.TokenType.PLUS, value: "+", line: startLine, column: startColumn });
                    break;
                case "-":
                    tokens.push({ type: types_1.TokenType.MINUS, value: "-", line: startLine, column: startColumn });
                    break;
                case "*":
                    tokens.push({ type: types_1.TokenType.STAR, value: "*", line: startLine, column: startColumn });
                    break;
                case "/":
                    tokens.push({ type: types_1.TokenType.SLASH, value: "/", line: startLine, column: startColumn });
                    break;
                case "%":
                    tokens.push({ type: types_1.TokenType.PERCENT, value: "%", line: startLine, column: startColumn });
                    break;
                case "=":
                    if (this.peek() === "=") {
                        this.advance();
                        tokens.push({ type: types_1.TokenType.EQ, value: "==", line: startLine, column: startColumn });
                    }
                    else {
                        tokens.push({ type: types_1.TokenType.ASSIGN, value: "=", line: startLine, column: startColumn });
                    }
                    break;
                case "!":
                    if (this.peek() === "=") {
                        this.advance();
                        tokens.push({ type: types_1.TokenType.NEQ, value: "!=", line: startLine, column: startColumn });
                    }
                    else {
                        this.error("Unexpected character '!'");
                    }
                    break;
                case "<":
                    if (this.peek() === "=") {
                        this.advance();
                        tokens.push({ type: types_1.TokenType.LTE, value: "<=", line: startLine, column: startColumn });
                    }
                    else {
                        tokens.push({ type: types_1.TokenType.LT, value: "<", line: startLine, column: startColumn });
                    }
                    break;
                case ">":
                    if (this.peek() === "=") {
                        this.advance();
                        tokens.push({ type: types_1.TokenType.GTE, value: ">=", line: startLine, column: startColumn });
                    }
                    else {
                        tokens.push({ type: types_1.TokenType.GT, value: ">", line: startLine, column: startColumn });
                    }
                    break;
                default:
                    this.error(`Unexpected character '${char}'`);
            }
        }
        tokens.push({
            type: types_1.TokenType.EOF,
            value: "",
            line: this.line,
            column: this.column
        });
        return tokens;
    }
    readNumber(startLine, startColumn) {
        let value = "";
        while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
            value += this.advance();
        }
        if (this.peek() === "." && /[0-9]/.test(this.peekNext())) {
            value += this.advance();
            while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
                value += this.advance();
            }
        }
        return { type: types_1.TokenType.NUMBER, value, line: startLine, column: startColumn };
    }
    readIdentifier(startLine, startColumn) {
        let value = "";
        while (!this.isAtEnd() && /[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.advance();
        }
        const type = this.keywords[value];
        if (type !== undefined) {
            return { type, value, line: startLine, column: startColumn };
        }
        return { type: types_1.TokenType.IDENTIFIER, value, line: startLine, column: startColumn };
    }
    readString(startLine, startColumn) {
        this.advance(); // Consume opening quote
        let value = "";
        while (!this.isAtEnd() && this.peek() !== '"') {
            const char = this.advance();
            if (char === "\\") {
                if (this.isAtEnd())
                    this.error("Unterminated escape sequence");
                const next = this.advance();
                if (next === "n")
                    value += "\n";
                else if (next === "t")
                    value += "\t";
                else if (next === "\\")
                    value += "\\";
                else if (next === '"')
                    value += '"';
                else
                    value += next;
            }
            else {
                value += char;
            }
        }
        if (this.isAtEnd()) {
            this.error("Unterminated string");
        }
        this.advance(); // Consume closing quote
        return { type: types_1.TokenType.STRING, value, line: startLine, column: startColumn };
    }
}
exports.Lexer = Lexer;
