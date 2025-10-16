export declare abstract class ValueObject<T> {
    protected readonly props: T;
    constructor(props: T);
    equals(vo?: ValueObject<T>): boolean;
}
export declare class UUID extends ValueObject<{
    value: string;
}> {
    constructor(value: string);
    private validate;
    get value(): string;
    toString(): string;
}
//# sourceMappingURL=value-object.base.d.ts.map