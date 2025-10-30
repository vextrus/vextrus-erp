export declare abstract class Specification<T> {
    abstract isSatisfiedBy(candidate: T): boolean;
    and(other: Specification<T>): Specification<T>;
    or(other: Specification<T>): Specification<T>;
    not(): Specification<T>;
}
//# sourceMappingURL=specification.base.d.ts.map