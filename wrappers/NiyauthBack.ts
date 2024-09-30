import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Slice, TupleItemSlice } from '@ton/core';

export type NiyauthBackConfig = {};

export function niyauthBackConfigToCell(config: NiyauthBackConfig): Cell {
    return beginCell().endCell();
}

export class NiyauthBack implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NiyauthBack(address);
    }

    static createFromConfig(config: NiyauthBackConfig, code: Cell, workchain = 0) {
        const data = niyauthBackConfigToCell(config);
        const init = { code, data };
        return new NiyauthBack(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSet(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            queryId: bigint;
            value: Slice;
        },
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(opts.queryId, 64)
                .storeSlice(opts.value)
                .endCell(),
        });
    }

    async sendClearOldValues(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            queryId: bigint;
        },
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(2, 32).storeUint(opts.queryId, 64).endCell(),
        });
    }

    async getByKey(provider: ContractProvider, key: bigint): Promise<[bigint, Slice]> {
        const result = (await provider.get('get_key', [{ type: 'int', value: key }])).stack;
        return [result.readBigNumber(), (result.peek() as TupleItemSlice).cell.asSlice()];
    }
}
