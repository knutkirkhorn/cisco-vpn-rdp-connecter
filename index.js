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
    try {
        await vpn.connect();
        console.log('Connected to VPN!');
    } catch (error) {
        const trimmedErrorMessage = error.message.replaceAll('VPN>', '').trim();
        const vpnCliConnectedMessage = `>> notice: Connected to ${config.vpnServer}.`;
        const isVpnConnectedRegex = /(.*)>> error: Connect not available. Another AnyConnect application is running(\r)+\nor this functionality was not requested by this application./gi;
        const isVpnAlreadyConnected = trimmedErrorMessage.endsWith(vpnCliConnectedMessage) || trimmedErrorMessage.match(isVpnConnectedRegex);

        if (isVpnAlreadyConnected) {
            console.log('Already connected to VPN!');
        } else {
            throw new Error(error);
        }
    }

    // Open RDP connection
    exec(`mstsc.exe /v:${config.rdpServer}`, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
        console.log(stderr);
    });
})();
