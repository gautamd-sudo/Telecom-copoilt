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
const client_1 = require("@prisma/client");
const network_repository_1 = require("../src/repository/network.repository");
describe('Tenant Isolation Test', () => {
    let prisma;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        prisma = new client_1.PrismaClient();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up
        yield prisma.network.deleteMany();
        yield prisma.organization.deleteMany();
        yield prisma.tenant.deleteMany();
        yield prisma.$disconnect();
    }));
    it('should prevent Tenant B from accessing Tenant A records', () => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Create two tenants
        const tenantA = yield prisma.tenant.create({ data: { name: 'Tenant A' } });
        const tenantB = yield prisma.tenant.create({ data: { name: 'Tenant B' } });
        // 2. Create an organization for Tenant A
        const orgA = yield prisma.organization.create({
            data: { name: 'Org A', tenantId: tenantA.id }
        });
        // 3. Create a network belonging to Tenant A
        const networkA = yield prisma.network.create({
            data: {
                name: 'Network A',
                type: '5G',
                organizationId: orgA.id,
                tenantId: tenantA.id
            }
        });
        // 4. Initialize repositories for Tenant A and Tenant B
        const repoA = new network_repository_1.NetworkRepository(prisma, tenantA.id);
        const repoB = new network_repository_1.NetworkRepository(prisma, tenantB.id);
        // 5. Assert Tenant A can see its network
        const networksA = yield repoA.findMany();
        expect(networksA).toHaveLength(1);
        expect(networksA[0].id).toBe(networkA.id);
        // 6. Assert Tenant B cannot see Tenant A's network
        const networksB = yield repoB.findMany();
        expect(networksB).toHaveLength(0);
        // 7. Assert Tenant B cannot update Tenant A's network
        yield expect(repoB.update({
            where: { id: networkA.id },
            data: { name: 'Hacked Network' }
        })).rejects.toThrow('Record not found or access denied');
    }));
});
