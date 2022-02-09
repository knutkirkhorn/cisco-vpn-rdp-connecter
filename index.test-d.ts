// eslint-disable-next-line import/no-extraneous-dependencies
import {expectType} from 'tsd';
import {
    CiscoVpnDefaults,
    closeRdpWindow,
    connectToVpn,
    connectToVpnAndOpenRdp,
    disconnectFromVpn,
    getCiscoVpnDefaults,
    getRdpDefaults,
    isCiscoVpnConnected,
    openRdpWindow,
    RdpDefaults
} from '.';

expectType<Promise<void>>(connectToVpn('example-server', '1', 'knut', 'supersecret'));
expectType<Promise<void>>(openRdpWindow('example-server'));
expectType<Promise<void>>(connectToVpnAndOpenRdp({
    server: 'example-server',
    group: '1',
    username: 'knut',
    password: 'supersecret'
}, 'example-server'));
expectType<Promise<boolean>>(isCiscoVpnConnected());
expectType<Promise<CiscoVpnDefaults>>(getCiscoVpnDefaults());
expectType<Promise<RdpDefaults>>(getRdpDefaults());
expectType<Promise<void>>(disconnectFromVpn());
expectType<Promise<void>>(closeRdpWindow());
