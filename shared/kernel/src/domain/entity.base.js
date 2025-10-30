"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    _id;
    _createdAt;
    _updatedAt;
    constructor(id) {
        this._id = id;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }
    get id() {
        return this._id;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        return this._id === entity._id;
    }
    updateTimestamp() {
        this._updatedAt = new Date();
    }
}
exports.Entity = Entity;
//# sourceMappingURL=entity.base.js.map