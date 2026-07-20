import { Statement, FunctionDeclStatement, ClassDeclStatement, MethodDecl } from "./types";
export interface IOHandler {
    print(message: string): void;
    input(prompt: string): Promise<string>;
    renderUI?(element: any): void | Promise<void>;
}
export interface Callable {
    arity(): number;
    call(interpreter: Interpreter, args: any[]): Promise<any>;
}
export declare class ReturnException {
    value: any;
    constructor(value: any);
}
export declare class BuiltinFunction implements Callable {
    private fn;
    private paramCount;
    constructor(paramCount: number, fn: (args: any[]) => Promise<any> | any);
    arity(): number;
    call(interpreter: Interpreter, args: any[]): Promise<any>;
}
export declare class UserFunction implements Callable {
    private declaration;
    private closure;
    constructor(declaration: FunctionDeclStatement, closure: Environment);
    arity(): number;
    call(interpreter: Interpreter, args: any[]): Promise<any>;
}
export declare class ClassCallable implements Callable {
    declaration: ClassDeclStatement;
    constructor(declaration: ClassDeclStatement);
    arity(): number;
    call(interpreter: Interpreter, args: any[]): Promise<any>;
}
export declare class ClassInstance {
    klass: ClassCallable;
    fields: Map<string, any>;
    constructor(klass: ClassCallable);
    toString(): string;
}
export declare class BoundMethod implements Callable {
    private instance;
    private method;
    constructor(instance: ClassInstance, method: MethodDecl);
    arity(): number;
    call(interpreter: Interpreter, args: any[]): Promise<any>;
}
export declare class Environment {
    private values;
    private outer;
    constructor(outer?: Environment | null);
    getOuter(): Environment | null;
    getVariables(): Map<string, any>;
    define(name: string, value: any): void;
    get(name: string, line: number): any;
    assign(name: string, value: any, line: number): void;
}
export declare class Interpreter {
    private io;
    globals: Environment;
    private environment;
    getVariables(): Record<string, any>;
    constructor(io: IOHandler);
    private setupGlobals;
    interpret(statements: Statement[]): Promise<void>;
    private execute;
    private executePrint;
    private executeVarDecl;
    private executeFunctionDecl;
    private executeClassDecl;
    private isInsideClassContext;
    private executeReturn;
    private executeIf;
    private executeWhile;
    private executeFor;
    executeBlock(statements: Statement[], env: Environment): Promise<void>;
    private evaluate;
    private evaluateBinary;
    private evaluateUnary;
    private evaluateInput;
    private evaluateAssign;
    private evaluateCall;
    private evaluateGet;
    private evaluateList;
    private evaluateDict;
    private checkNumberOperand;
    private checkNumberOperands;
    private checkComparableOperands;
    private isTruthy;
    private stringify;
}
