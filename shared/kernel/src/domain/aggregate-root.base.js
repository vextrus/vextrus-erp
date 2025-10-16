"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const cqrs_1 = require("@nestjs/cqrs");
class AggregateRoot extends cqrs_1.AggregateRoot {
    _domainEvents = [];
    _version = 0;
    get domainEvents() {
        return this._domainEvents;
    }
    get version() {
        return this._version;
    }
    addDomainEvent(event) {
        this._domainEvents.push(event);
        this.apply(event);
    }
    clearEvents() {
        this._domainEvents = [];
    }
    incrementVersion() {
        this._version++;
    }
    loadFromHistory(history) {
        history.forEach((event) => {
            this.apply(event, true);
            this._version++;
        });
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.base.js.map