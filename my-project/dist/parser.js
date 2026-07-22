"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const types_1 = require("./types");
class Parser {
    tokens;
    current = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    isAtEnd() {
        return this.peek().type === types_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        this.error(this.peek(), message);
    }
    error(token, message) {
        throw new Error(`[Parser Error] ${message} at line ${token.line}, column ${token.column} (got '${token.value}')`);
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.statement());
        }
        return statements;
    }
    statement() {
        if (this.match(types_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(types_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(types_1.TokenType.WHILE))
            return this.whileStatement();
        if (this.match(types_1.TokenType.FOR))
            return this.forStatement();
        if (this.match(types_1.TokenType.FUNC))
            return this.functionDecl();
        if (this.match(types_1.TokenType.RETURN))
            return this.returnStatement();
        if (this.match(types_1.TokenType.CLASS))
            return this.classDecl();
        if (this.match(types_1.TokenType.TRY))
            return this.tryCatchStatement();
        return this.expressionStatement();
    }
    printStatement() {
        const line = this.previous().line;
        const expression = this.expression();
        return {
            type: "PrintStatement",
            expression,
            line
        };
    }
    functionDecl() {
        const line = this.previous().line;
        const name = this.consume(types_1.TokenType.IDENTIFIER, "Expect function name.").value;
        this.consume(types_1.TokenType.LPAREN, "Expect '(' after function name.");
        const params = [];
        if (!this.check(types_1.TokenType.RPAREN)) {
            do {
                params.push(this.consume(types_1.TokenType.IDENTIFIER, "Expect parameter name.").value);
            } while (this.match(types_1.TokenType.COMMA));
        }
        this.consume(types_1.TokenType.RPAREN, "Expect ')' after parameters.");
        this.consume(types_1.TokenType.LBRACE, "Expect '{' before function body.");
        const body = this.block();
        return {
            type: "FunctionDeclStatement",
            name,
            params,
            body,
            line
        };
    }
    returnStatement() {
        const line = this.previous().line;
        let value = null;
        if (!this.check(types_1.TokenType.RBRACE)) {
            value = this.expression();
        }
        return {
            type: "ReturnStatement",
            value,
            line
        };
    }
    ifStatement() {
        const line = this.previous().line;
        const condition = this.expression();
        this.consume(types_1.TokenType.LBRACE, "Expect '{' before if-block body.");
        const thenBranch = this.block();
        let elseBranch = null;
        if (this.match(types_1.TokenType.ELSE)) {
            if (this.match(types_1.TokenType.IF)) {
                elseBranch = [this.ifStatement()];
            }
            else {
                this.consume(types_1.TokenType.LBRACE, "Expect '{' before else-block body.");
                elseBranch = this.block();
            }
        }
        return {
            type: "IfStatement",
            condition,
            thenBranch,
            elseBranch,
            line
        };
    }
    whileStatement() {
        const line = this.previous().line;
        const condition = this.expression();
        this.consume(types_1.TokenType.LBRACE, "Expect '{' before while-block body.");
        const body = this.block();
        return {
            type: "WhileStatement",
            condition,
            body,
            line
        };
    }
    forStatement() {
        const line = this.previous().line;
        const item = this.consume(types_1.TokenType.IDENTIFIER, "Expect loop variable name after 'for'.").value;
        this.consume(types_1.TokenType.IN, "Expect 'in' after loop variable.");
        const iterator = this.expression();
        this.consume(types_1.TokenType.LBRACE, "Expect '{' before loop body.");
        const body = this.block();
        return {
            type: "ForStatement",
            item,
            iterator,
            body,
            line
        };
    }
    block() {
        const statements = [];
        while (!this.check(types_1.TokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.statement());
        }
        this.consume(types_1.TokenType.RBRACE, "Expect '}' to close block.");
        return statements;
    }
    expressionStatement() {
        const line = this.peek().line;
        const expr = this.expression();
        return {
            type: "ExpressionStatement",
            expression: expr,
            line
        };
    }
    // --- Expressions ---
    expression() {
        return this.assignment();
    }
    assignment() {
        const expr = this.logicalOr();
        if (this.match(types_1.TokenType.ASSIGN)) {
            const equals = this.previous();
            const value = this.assignment();
            // Target must be a VariableExpression or GetExpression
            if (expr.type === "VariableExpression" || expr.type === "GetExpression") {
                return {
                    type: "AssignExpression",
                    name: expr,
                    value,
                    line: equals.line
                };
            }
            this.error(equals, "Invalid assignment target.");
        }
        return expr;
    }
    logicalOr() {
        let expr = this.logicalAnd();
        while (this.match(types_1.TokenType.OR)) {
            const operator = this.previous().value;
            const right = this.logicalAnd();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    logicalAnd() {
        let expr = this.equality();
        while (this.match(types_1.TokenType.AND)) {
            const operator = this.previous().value;
            const right = this.equality();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    equality() {
        let expr = this.comparison();
        while (this.match(types_1.TokenType.EQ, types_1.TokenType.NEQ)) {
            const operator = this.previous().value;
            const right = this.comparison();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    comparison() {
        let expr = this.term();
        while (this.match(types_1.TokenType.LT, types_1.TokenType.GT, types_1.TokenType.LTE, types_1.TokenType.GTE)) {
            const operator = this.previous().value;
            const right = this.term();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(types_1.TokenType.PLUS, types_1.TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    factor() {
        let expr = this.unary();
        while (this.match(types_1.TokenType.STAR, types_1.TokenType.SLASH, types_1.TokenType.PERCENT)) {
            const operator = this.previous().value;
            const right = this.unary();
            expr = {
                type: "BinaryExpression",
                left: expr,
                operator,
                right,
                line: this.previous().line
            };
        }
        return expr;
    }
    unary() {
        if (this.match(types_1.TokenType.NOT, types_1.TokenType.MINUS, types_1.TokenType.PLUS)) {
            const operator = this.previous().value;
            const right = this.unary();
            return {
                type: "UnaryExpression",
                operator,
                right,
                line: this.previous().line
            };
        }
        return this.call();
    }
    call() {
        let expr = this.primary();
        while (true) {
            if (this.match(types_1.TokenType.LPAREN)) {
                expr = this.finishCall(expr);
            }
            else if (this.match(types_1.TokenType.DOT)) {
                const nameToken = this.consume(types_1.TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = {
                    type: "GetExpression",
                    object: expr,
                    property: { type: "LiteralExpression", value: nameToken.value, line: nameToken.line },
                    isComputed: false,
                    line: nameToken.line
                };
            }
            else if (this.match(types_1.TokenType.LBRACKET)) {
                const indexExpr = this.expression();
                const closeBracket = this.consume(types_1.TokenType.RBRACKET, "Expect ']' after index.");
                expr = {
                    type: "GetExpression",
                    object: expr,
                    property: indexExpr,
                    isComputed: true,
                    line: closeBracket.line
                };
            }
            else {
                break;
            }
        }
        return expr;
    }
    finishCall(callee) {
        const args = [];
        if (!this.check(types_1.TokenType.RPAREN)) {
            do {
                args.push(this.expression());
            } while (this.match(types_1.TokenType.COMMA));
        }
        const paren = this.consume(types_1.TokenType.RPAREN, "Expect ')' after arguments.");
        return {
            type: "CallExpression",
            callee,
            args,
            line: paren.line
        };
    }
    primary() {
        const token = this.peek();
        if (this.match(types_1.TokenType.BOOLEAN)) {
            return {
                type: "LiteralExpression",
                value: this.previous().value === "true",
                line: token.line
            };
        }
        if (this.match(types_1.TokenType.NULL)) {
            return {
                type: "LiteralExpression",
                value: null,
                line: token.line
            };
        }
        if (this.match(types_1.TokenType.NUMBER)) {
            return {
                type: "LiteralExpression",
                value: Number(this.previous().value),
                line: token.line
            };
        }
        if (this.match(types_1.TokenType.STRING)) {
            return {
                type: "LiteralExpression",
                value: this.previous().value,
                line: token.line
            };
        }
        if (this.match(types_1.TokenType.INPUT)) {
            const line = this.previous().line;
            const prompt = this.expression();
            return {
                type: "InputExpression",
                prompt,
                line
            };
        }
        if (this.match(types_1.TokenType.IDENTIFIER)) {
            return {
                type: "VariableExpression",
                name: this.previous().value,
                line: token.line
            };
        }
        if (this.match(types_1.TokenType.LBRACKET)) {
            const line = this.previous().line;
            const elements = [];
            if (!this.check(types_1.TokenType.RBRACKET)) {
                do {
                    elements.push(this.expression());
                } while (this.match(types_1.TokenType.COMMA));
            }
            this.consume(types_1.TokenType.RBRACKET, "Expect ']' after list elements.");
            return {
                type: "ListExpression",
                elements,
                line
            };
        }
        if (this.match(types_1.TokenType.LBRACE)) {
            const line = this.previous().line;
            const properties = [];
            if (!this.check(types_1.TokenType.RBRACE)) {
                do {
                    let key;
                    if (this.match(types_1.TokenType.STRING)) {
                        key = this.previous().value;
                    }
                    else {
                        key = this.consume(types_1.TokenType.IDENTIFIER, "Expect dictionary key (identifier or string).").value;
                    }
                    this.consume(types_1.TokenType.COLON, "Expect ':' after key.");
                    const value = this.expression();
                    properties.push({ key, value });
                } while (this.match(types_1.TokenType.COMMA));
            }
            this.consume(types_1.TokenType.RBRACE, "Expect '}' after dictionary properties.");
            return {
                type: "DictExpression",
                properties,
                line
            };
        }
        if (this.match(types_1.TokenType.LPAREN)) {
            const expr = this.expression();
            this.consume(types_1.TokenType.RPAREN, "Expect ')' after expression.");
            return expr;
        }
        this.error(token, "Expect expression.");
    }
    classDecl() {
        const line = this.previous().line;
        const name = this.consume(types_1.TokenType.IDENTIFIER, "Expect class name.").value;
        let parent = null;
        if (this.match(types_1.TokenType.EXTENDS)) {
            parent = this.consume(types_1.TokenType.IDENTIFIER, "Expect parent class name.").value;
        }
        this.consume(types_1.TokenType.LBRACE, "Expect '{' before class body.");
        const methods = [];
        while (!this.check(types_1.TokenType.RBRACE) && !this.isAtEnd()) {
            let visibility = "public";
            if (this.match(types_1.TokenType.PUBLIC)) {
                visibility = "public";
            }
            else if (this.match(types_1.TokenType.PRIVATE)) {
                visibility = "private";
            }
            else if (this.match(types_1.TokenType.PROTECTED)) {
                visibility = "protected";
            }
            this.consume(types_1.TokenType.FUNC, "Expect 'func' for method declaration.");
            const methodLine = this.previous().line;
            const methodName = this.consume(types_1.TokenType.IDENTIFIER, "Expect method name.").value;
            this.consume(types_1.TokenType.LPAREN, "Expect '(' after method name.");
            const params = [];
            if (!this.check(types_1.TokenType.RPAREN)) {
                do {
                    params.push(this.consume(types_1.TokenType.IDENTIFIER, "Expect parameter name.").value);
                } while (this.match(types_1.TokenType.COMMA));
            }
            this.consume(types_1.TokenType.RPAREN, "Expect ')' after parameters.");
            this.consume(types_1.TokenType.LBRACE, "Expect '{' before method body.");
            const body = this.block();
            methods.push({
                name: methodName,
                params,
                body,
                visibility,
                line: methodLine
            });
        }
        this.consume(types_1.TokenType.RBRACE, "Expect '}' after class body.");
        return {
            type: "ClassDeclStatement",
            name,
            parent,
            methods,
            line
        };
    }
    tryCatchStatement() {
        const line = this.previous().line;
        this.consume(types_1.TokenType.LBRACE, "Expect '{' after 'try'.");
        const tryBranch = this.block();
        let catchVar = null;
        let catchBranch = null;
        if (this.match(types_1.TokenType.CATCH)) {
            if (this.match(types_1.TokenType.LPAREN)) {
                catchVar = this.consume(types_1.TokenType.IDENTIFIER, "Expect catch variable name.").value;
                this.consume(types_1.TokenType.RPAREN, "Expect ')' after catch variable.");
            }
            else if (this.check(types_1.TokenType.IDENTIFIER)) {
                catchVar = this.advance().value;
            }
            this.consume(types_1.TokenType.LBRACE, "Expect '{' before catch body.");
            catchBranch = this.block();
        }
        let finallyBranch = null;
        if (this.match(types_1.TokenType.FINALLY)) {
            this.consume(types_1.TokenType.LBRACE, "Expect '{' before finally body.");
            finallyBranch = this.block();
        }
        if (!catchBranch && !finallyBranch) {
            throw new Error(`[Parser Error] Expect 'catch' or 'finally' after 'try' block at line ${line}.`);
        }
        return {
            type: "TryCatchStatement",
            tryBranch,
            catchVar,
            catchBranch,
            finallyBranch,
            line
        };
    }
}
exports.Parser = Parser;
