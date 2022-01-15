import ciscoVpn from 'cisco-vpn';
import {exec} from 'node:child_process';
import config from './config.js';

if (!config.vpnServer || !config.vpnUsername || !config.vpnPassword || !config.rdpServer) {
    throw new Error('Need to set all required configuration for connecting to Cisco VPN and opening Microsoft RDP!');
}

// TODO: Remove when this fixed in the package (https://github.com/MarkTiedemann/cisco-vpn/issues/6)
const combinedVpnGroupAndUsername = `${config.vpnTunnelType}\n${config.vpnUsername}`;

const vpn = ciscoVpn({
    server: config.vpnServer,
    username: combinedVpnGroupAndUsername,
    password: config.vpnPassword
});

(async () => {
    await vpn.connect();
    console.log('Connected to VPN!');

    // Open RDP connection
    exec(`mstsc.exe /v:${config.rdpServer}`, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
        console.log(stderr);
    });
})();
