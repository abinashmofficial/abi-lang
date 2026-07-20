import { Token } from "./types";
export declare class Lexer {
    private source;
    private position;
    private line;
    private column;
    private keywords;
    constructor(source: string);
    private isAtEnd;
    private peek;
    private peekNext;
    private advance;
    private error;
    tokenize(): Token[];
    private readNumber;
    private readIdentifier;
    private readString;
}
