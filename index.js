const ciscoVpn = require('cisco-vpn');
// eslint-disable-next-line import/no-unresolved
const {spawn, exec} = require('node:child_process');
// eslint-disable-next-line import/no-unresolved
const path = require('node:path');
const {xml2js} = require('xml-js');
const {readFile} = require('fs/promises');

async function connectToVpn(server, group, username, password) {
    // Require that all credentials are set
    if (server === undefined || group === undefined || username === undefined || password === undefined) {
        throw new Error('Need to set all credentials for connecting to Cisco VPN!');
    }

    // TODO: Remove when this fixed in the package (https://github.com/MarkTiedemann/cisco-vpn/issues/6)
    const combinedVpnGroupAndUsername = `${group}\n${username}`;

    const vpn = ciscoVpn({
        server,
        username: combinedVpnGroupAndUsername,
        password
    });

    try {
        await vpn.connect();
    } catch (error) {
        const trimmedErrorMessage = error.message.replaceAll('VPN>', '').trim();
        const vpnCliConnectedMessage = `>> notice: Connected to ${server}.`;
        const isVpnConnectedRegex = /(.*)>> error: Connect not available. Another AnyConnect application is running(\r)+\nor this functionality was not requested by this application./gi;
        const isVpnAlreadyConnected = trimmedErrorMessage.endsWith(vpnCliConnectedMessage) || trimmedErrorMessage.match(isVpnConnectedRegex);

        if (isVpnAlreadyConnected) {
            throw new Error('Already connected to VPN!');
        } else {
            throw new Error(error);
        }
    }
}

async function openRdpWindow(server) {
    // Require that all credentials are set
    if (server === undefined) {
        throw new Error('Need to set all credentials for opening Microsoft RDP!');
    }

    // Open RDP window
    return new Promise(resolve => {
        // Needs to promisify `spawn` because `spawnSync` does not return after starting `mstsc`
        const process = spawn('cmd.exe', ['/c', 'start', 'mstsc.exe', `/v:${server}`]);
        process.on('exit', () => resolve());
    });
}

async function connectToVpnAndOpenRdp(vpnCredentials, rdpServer) {
    await connectToVpn(...vpnCredentials);
    await openRdpWindow(rdpServer);
}

async function isCiscoVpnConnected() {
    return new Promise((resolve, reject) => {
        exec('"C:/Program Files (x86)/Cisco/Cisco AnyConnect Secure Mobility Client/vpncli.exe" stats', (error, stdout) => {
            if (error) {
                return reject(error);
            }

            const returnMessage = stdout.toString();
            const vpnState = returnMessage.trim()
                .match(/(.*)Connection State:(.*)/gi)
                .find(match => !match.includes('management')).trim()
                .split(':')[1].trim();

            return resolve(vpnState === 'Connected');
        });
    });
}

async function convertGroupToGroupNumber(server, group) {
    // If it's already a number, just return it
    if (typeof group === 'number') {
        return group;
    }

    return new Promise((resolve, reject) => {
        const vpnProcess = spawn('C:/Program Files (x86)/Cisco/Cisco AnyConnect Secure Mobility Client/vpncli.exe', ['connect', server]);

        // eslint-disable-next-line consistent-return
        vpnProcess.stdout.on('data', data => {
            if (data.includes('Group: ')) {
                vpnProcess.kill();
                const groupLines = data.toString().trim()
                    .split('>> Please enter your username and password.')[1].trim().split('\n');
                const selectedGroupLine = groupLines.find(groupLine => groupLine.trim().endsWith(group)).trim();
                const groupNumber = selectedGroupLine.split(')')[0];
                return resolve(groupNumber);
            }
        });
    });
}

async function getCiscoVpnDefaults() {
    const filePath = path.join(process.env.APPDATA, '..\\Local\\Cisco\\Cisco AnyConnect Secure Mobility Client\\preferences.xml');
    const xmlFile = await readFile(filePath, 'utf-8');
    const anyConnectXmlElement = xml2js(xmlFile).elements[0];
    const anyConnectElements = anyConnectXmlElement.elements;

    const server = anyConnectElements.find(element => element.name === 'DefaultHostName').elements[0].text;
    const groupText = anyConnectElements.find(element => element.name === 'DefaultGroup').elements[0].text;
    const group = await convertGroupToGroupNumber(server, groupText);
    const username = anyConnectElements.find(element => element.name === 'DefaultUser').elements[0].text;

    return {server, group, username};
}

async function disconnectFromVpn() {
    try {
        // TODO: passing redundant values because it requires input. Remove this when/if fixed.
        await ciscoVpn({server: 'noop', username: 'noop', password: 'noop'}).disconnect();
    } catch (error) {
        // Check if the VPN client is not connected
        const trimmedErrorMessage = error.message.replaceAll('VPN>', '').trim();
        const isVpnAlreadyDisconnected = trimmedErrorMessage.endsWith('The VPN client is not connected.');

        if (!isVpnAlreadyDisconnected) {
            throw new Error(error);
        }
    }
}

async function closeRdpWindow() {
    return new Promise(resolve => {
        const process = spawn('taskkill', ['/im', 'mstsc.exe']);
        process.on('exit', () => resolve());
    });
}

module.exports.connectToVpn = connectToVpn;
module.exports.openRdpWindow = openRdpWindow;
module.exports.connectToVpnAndOpenRdp = connectToVpnAndOpenRdp;
module.exports.isCiscoVpnConnected = isCiscoVpnConnected;
module.exports.getCiscoVpnDefaults = getCiscoVpnDefaults;
module.exports.disconnectFromVpn = disconnectFromVpn;
module.exports.closeRdpWindow = closeRdpWindow;
