"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = exports.ValueObject = void 0;
class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}
exports.ValueObject = ValueObject;
class UUID extends ValueObject {
    constructor(value) {
        super({ value });
        this.validate(value);
    }
    validate(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            throw new Error('Invalid UUID format');
        }
    }
    get value() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.UUID = UUID;
//# sourceMappingURL=value-object.base.js.map