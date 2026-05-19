"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactObject = void 0;
const compactObject = (value) => Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== ''));
exports.compactObject = compactObject;
//# sourceMappingURL=inputHelpers.js.map