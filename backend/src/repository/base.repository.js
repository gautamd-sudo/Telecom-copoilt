"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(prisma, model, // The specific Prisma model delegate (e.g., prisma.network)
    tenantId) {
        this.prisma = prisma;
        this.model = model;
        this.tenantId = tenantId;
    }
    findMany() {
        return __awaiter(this, arguments, void 0, function* (args = {}) {
            return this.model.findMany(Object.assign(Object.assign({}, args), { where: Object.assign(Object.assign({}, args.where), { tenantId: this.tenantId, deletedAt: null // Soft delete
                 }) }));
        });
    }
    findUnique(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.model.findUnique(args);
            if (!record || record.tenantId !== this.tenantId || record.deletedAt !== null) {
                return null;
            }
            return record;
        });
    }
    create(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.create(Object.assign(Object.assign({}, args), { data: Object.assign(Object.assign({}, args.data), { tenantId: this.tenantId }) }));
        });
    }
    update(args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the record belongs to the tenant before updating
            const existing = yield this.findUnique({ where: args.where });
            if (!existing) {
                throw new Error("Record not found or access denied");
            }
            return this.model.update(args);
        });
    }
    softDelete(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.findUnique({ where: args.where });
            if (!existing) {
                throw new Error("Record not found or access denied");
            }
            return this.model.update({
                where: args.where,
                data: { deletedAt: new Date() }
            });
        });
    }
}
exports.BaseRepository = BaseRepository;
