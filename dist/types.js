"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Literals
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["BOOLEAN"] = "BOOLEAN";
    TokenType["NULL"] = "NULL";
    // Operators
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["STAR"] = "STAR";
    TokenType["SLASH"] = "SLASH";
    TokenType["PERCENT"] = "PERCENT";
    // Comparisons
    TokenType["EQ"] = "EQ";
    TokenType["NEQ"] = "NEQ";
    TokenType["LT"] = "LT";
    TokenType["GT"] = "GT";
    TokenType["LTE"] = "LTE";
    TokenType["GTE"] = "GTE";
    // Logical
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["NOT"] = "NOT";
    // Punctuation
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    TokenType["COMMA"] = "COMMA";
    TokenType["COLON"] = "COLON";
    TokenType["DOT"] = "DOT";
    // Keywords
    TokenType["PRINT"] = "PRINT";
    TokenType["INPUT"] = "INPUT";
    TokenType["IF"] = "IF";
    TokenType["ELSE"] = "ELSE";
    TokenType["WHILE"] = "WHILE";
    TokenType["FUNC"] = "FUNC";
    TokenType["RETURN"] = "RETURN";
    TokenType["FOR"] = "FOR";
    TokenType["IN"] = "IN";
    TokenType["CLASS"] = "CLASS";
    TokenType["PUBLIC"] = "PUBLIC";
    TokenType["PRIVATE"] = "PRIVATE";
    TokenType["PROTECTED"] = "PROTECTED";
    TokenType["EOF"] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
