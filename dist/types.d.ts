export declare enum TokenType {
    NUMBER = "NUMBER",
    STRING = "STRING",
    IDENTIFIER = "IDENTIFIER",
    BOOLEAN = "BOOLEAN",
    NULL = "NULL",
    ASSIGN = "ASSIGN",// =
    PLUS = "PLUS",// +
    MINUS = "MINUS",// -
    STAR = "STAR",// *
    SLASH = "SLASH",// /
    PERCENT = "PERCENT",// %
    EQ = "EQ",// ==
    NEQ = "NEQ",// !=
    LT = "LT",// <
    GT = "GT",// >
    LTE = "LTE",// <=
    GTE = "GTE",// >=
    AND = "AND",// and
    OR = "OR",// or
    NOT = "NOT",// not
    LPAREN = "LPAREN",// (
    RPAREN = "RPAREN",// )
    LBRACE = "LBRACE",// {
    RBRACE = "RBRACE",// }
    LBRACKET = "LBRACKET",// [
    RBRACKET = "RBRACKET",// ]
    COMMA = "COMMA",// ,
    COLON = "COLON",// :
    DOT = "DOT",// .
    PRINT = "PRINT",
    INPUT = "INPUT",
    IF = "IF",
    ELSE = "ELSE",
    WHILE = "WHILE",
    FUNC = "FUNC",
    RETURN = "RETURN",
    FOR = "FOR",
    IN = "IN",
    EOF = "EOF"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export type ASTNode = Statement | Expression;
export type Statement = PrintStatement | VarDeclStatement | IfStatement | WhileStatement | ForStatement | FunctionDeclStatement | ReturnStatement | ExpressionStatement;
export interface PrintStatement {
    type: "PrintStatement";
    expression: Expression;
    line: number;
}
export interface VarDeclStatement {
    type: "VarDeclStatement";
    name: string;
    expression: Expression;
    line: number;
}
export interface IfStatement {
    type: "IfStatement";
    condition: Expression;
    thenBranch: Statement[];
    elseBranch: Statement[] | null;
    line: number;
}
export interface WhileStatement {
    type: "WhileStatement";
    condition: Expression;
    body: Statement[];
    line: number;
}
export interface ForStatement {
    type: "ForStatement";
    item: string;
    iterator: Expression;
    body: Statement[];
    line: number;
}
export interface FunctionDeclStatement {
    type: "FunctionDeclStatement";
    name: string;
    params: string[];
    body: Statement[];
    line: number;
}
export interface ReturnStatement {
    type: "ReturnStatement";
    value: Expression | null;
    line: number;
}
export interface ExpressionStatement {
    type: "ExpressionStatement";
    expression: Expression;
    line: number;
}
export type Expression = LiteralExpression | VariableExpression | BinaryExpression | UnaryExpression | InputExpression | AssignExpression | CallExpression | GetExpression | ListExpression | DictExpression;
export interface LiteralExpression {
    type: "LiteralExpression";
    value: any;
    line: number;
}
export interface VariableExpression {
    type: "VariableExpression";
    name: string;
    line: number;
}
export interface BinaryExpression {
    type: "BinaryExpression";
    left: Expression;
    operator: string;
    right: Expression;
    line: number;
}
export interface UnaryExpression {
    type: "UnaryExpression";
    operator: string;
    right: Expression;
    line: number;
}
export interface InputExpression {
    type: "InputExpression";
    prompt: Expression;
    line: number;
}
export interface AssignExpression {
    type: "AssignExpression";
    name: Expression;
    value: Expression;
    line: number;
}
export interface CallExpression {
    type: "CallExpression";
    callee: Expression;
    args: Expression[];
    line: number;
}
export interface GetExpression {
    type: "GetExpression";
    object: Expression;
    property: Expression;
    isComputed: boolean;
    line: number;
}
export interface ListExpression {
    type: "ListExpression";
    elements: Expression[];
    line: number;
}
export interface DictExpression {
    type: "DictExpression";
    properties: Array<{
        key: string;
        value: Expression;
    }>;
    line: number;
}
