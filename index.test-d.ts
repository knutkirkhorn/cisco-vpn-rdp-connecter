import {expectType} from 'tsd';
import {
    CiscoVpnGroup,
    CiscoVpnDefaults,
    closeRdpWindow,
    connectToVpn,
    connectToVpnAndOpenRdp,
    disconnectFromVpn,
    getAllCiscoVpnGroups,
    getCiscoVpnDefaults,
    getRdpDefaults,
    isCiscoVpnConnected,
    isRdpWindowOpened,
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
expectType<Promise<boolean>>(isRdpWindowOpened());
expectType<Promise<CiscoVpnGroup[]>>(getAllCiscoVpnGroups('example-server'));
expectType<Promise<CiscoVpnDefaults>>(getCiscoVpnDefaults());
expectType<Promise<RdpDefaults>>(getRdpDefaults());
expectType<Promise<void>>(disconnectFromVpn());
expectType<Promise<void>>(closeRdpWindow());
