import { toNano } from '@ton/core';
import { NiyauthBack } from '../wrappers/NiyauthBack';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const niyauthBack = provider.open(NiyauthBack.createFromConfig({}, await compile('NiyauthBack')));

    await niyauthBack.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(niyauthBack.address);

    // run methods on `niyauthBack`
}
