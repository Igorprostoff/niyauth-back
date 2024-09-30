import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, BitString, Cell, toNano } from '@ton/core';
import { NiyauthBack } from '../wrappers/NiyauthBack';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('NiyauthBack', () => {
    let code: Cell;

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('NiyauthBack');
    });

    let niyauthBack: SandboxContract<NiyauthBack>;

    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;

    let user1keyX = 0xf258163f65f65865a79a4279e2ebabb5a57b85501dd4b381d1dc605c434876e3n;
    let user1keyY = 0x4c308bd3f18f062d5cc07f34948ced82f9a76f9c3e65ae64f158412da8e92e6dn;

    let user2keyX = 0xf258163f65f65865a79a4279e2ebabb5a57b85501dd4b381d1dc605c434876e2n;
    let user2keyY = 0x4c308bd3f18f062d5cc07f34948ced82f9a76f9c3e65ae64f158412da8e92e6cn;

    let user3keyX = 0xf258163f65f65865a79a4279e2ebabb5a57b85501dd4b381d1dc605c434876e1n;
    let user3keyY = 0x4c308bd3f18f062d5cc07f34948ced82f9a76f9c3e65ae64f158412da8e92e6bn;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain.now = 500;

        niyauthBack = blockchain.openContract(NiyauthBack.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await niyauthBack.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: niyauthBack.address,
            deploy: true,
        });

        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        //console.log(deployResult.transactions[0]);
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and niyauthBack are ready to use
    });

    it('should store and retrieve values', async () => {
        //0440F258163F65F65865A79A4279E2EBABB5A57B85501DD4B381D1DC605C434876E34C308BD3F18F062D5CC07F34948CED82F9A76F9C3E65AE64F158412DA8E92E6D
        let result = await niyauthBack.sendSet(user1.getSender(), toNano('0.05'), {
            queryId: 123n,
            value: beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user1keyX, 256)
                .storeUint(user1keyY, 256)
                .endCell()
                .asSlice(),
        });

        expect(result.transactions).toHaveTransaction({
            from: user1.address,
            to: niyauthBack.address,
            success: true,
        });
        blockchain.now = 1500;

        result = await niyauthBack.sendSet(user2.getSender(), toNano('0.05'), {
            queryId: 123n,
            value: beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user2keyX, 256)
                .storeUint(user2keyY, 256)
                .endCell()
                .asSlice(),
        });
        expect(result.transactions).toHaveTransaction({
            from: user2.address,
            to: niyauthBack.address,
            success: true,
        });
        blockchain.now = 2500;

        result = await niyauthBack.sendSet(user3.getSender(), toNano('0.05'), {
            queryId: 123n,
            value: beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user3keyX, 256)
                .storeUint(user3keyY, 256)
                .endCell()
                .asSlice(),
        });

        expect(result.transactions).toHaveTransaction({
            from: user3.address,
            to: niyauthBack.address,
            success: true,
        });
        let [validUntil, value] = await niyauthBack.getByKey(
            BigInt('0x' + user1.address.toRaw().toString('hex', 0, 32)),
        );
        
        expect(value).toEqualSlice(
            beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user1keyX, 256)
                .storeUint(user1keyY, 256)
                .endCell()
                .asSlice(),
        );

        [validUntil, value] = await niyauthBack.getByKey(BigInt('0x' + user2.address.toRaw().toString('hex', 0, 32)));
        expect(validUntil).toEqual(1500n + 60n * 60n * 24n * 30n);
        expect(value).toEqualSlice(
            beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user2keyX, 256)
                .storeUint(user2keyY, 256)
                .asSlice(),
        );

        [validUntil, value] = await niyauthBack.getByKey(BigInt('0x' + user3.address.toRaw().toString('hex', 0, 32)));
        expect(validUntil).toEqual(2500n + 60n * 60n * 24n * 30n);
        expect(value).toEqualSlice(
            beginCell()
                .storeUint(0x04, 8)
                .storeUint(0x40, 8)
                .storeUint(user3keyX, 256)
                .storeUint(user3keyY, 256)
                .endCell()
                .asSlice(),
        );
    });
});
