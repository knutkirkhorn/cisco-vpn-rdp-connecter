const ciscoVpn = require('cisco-vpn');
// eslint-disable-next-line import/no-unresolved
const {spawn, exec} = require('node:child_process');
// eslint-disable-next-line import/no-unresolved
const path = require('node:path');
const {xml2js} = require('xml-js');
// eslint-disable-next-line import/no-unresolved
const {readFile} = require('fs/promises');
const regedit = require('regedit');
const isOnline = require('is-online');

async function connectToVpn(server, group, username, password) {
    // Require that all credentials are set
    if (server === undefined || group === undefined || username === undefined || password === undefined) {
        throw new Error('All credentials are required to connect to Cisco VPN');
    }

    // Check if internet is not connected
    const hasInternetConnection = await isOnline();

    if (!hasInternetConnection) {
        throw new Error('No internet connection');
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

        const isIncorrectLoginDetails = trimmedErrorMessage.endsWith('Login failed.');
        if (isIncorrectLoginDetails) {
            throw new Error('Incorrect login details');
        }

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
        throw new Error('`server` is required');
    }

    // Open RDP window
    return new Promise(resolve => {
        // Needs to promisify `spawn` because `spawnSync` does not return after starting `mstsc`
        const rdpProcess = spawn('cmd.exe', ['/c', 'start', 'mstsc.exe', `/v:${server}`]);
        rdpProcess.on('exit', () => resolve());
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

async function isRdpWindowOpened() {
    return new Promise((resolve, reject) => {
        exec('tasklist', (error, stdout) => {
            if (error) {
                return reject(error);
            }

            const isRdpOpened = stdout.toLowerCase().includes('mstsc');
            return resolve(isRdpOpened);
        });
    });
}

async function getAllCiscoVpnGroups(server) {
    if (server === undefined) {
        throw new Error('`server` is required');
    }

    // Check if internet is not connected
    const hasInternetConnection = await isOnline();

    if (!hasInternetConnection) {
        throw new Error('No internet connection');
    }

    return new Promise(resolve => {
        const vpnProcess = spawn('C:/Program Files (x86)/Cisco/Cisco AnyConnect Secure Mobility Client/vpncli.exe', ['connect', server]);

        // Default to group `0` if it fails to start `connect` (already connected to VPN)
        const defaultGroup = [
            {
                number: '0',
                name: 'Default'
            }
        ];
        vpnProcess.on('close', () => resolve(defaultGroup));

        vpnProcess.stdout.on('data', data => {
            if (!data.includes('Group: ')) {
                return;
            }

            const untrimmedGroupLines = data.toString().trim()
                .split('>> Please enter your username and password.');

            // Ensure it contains the groups
            if (!untrimmedGroupLines || untrimmedGroupLines.length < 2) {
                return;
            }

            vpnProcess.kill();
            const groupLines = untrimmedGroupLines[1].trim().split('\n');
            const groupLineRegex = /(\d+)\)(.*)/;
            const groups = groupLines
                .map(groupLine => groupLine.trim())
                .filter(groupLine => groupLine.match(groupLineRegex))
                .map(groupLine => {
                    const groupLineData = groupLine.split(') ');
                    const [number, name] = groupLineData;
                    return {
                        number,
                        name
                    };
                });
            // eslint-disable-next-line consistent-return
            return resolve(groups);
        });
    });
}

async function convertGroupToGroupNumber(server, group) {
    if (server === undefined || group === undefined) {
        throw new Error('Both `server` and `group` is required');
    }

    // If it's already a number, just return it
    if (typeof group === 'number') {
        return group;
    }

    const ciscoVpnGroups = await getAllCiscoVpnGroups(server);
    const groupNumber = ciscoVpnGroups.find(vpnGroup => vpnGroup.name === group);

    if (groupNumber === undefined) {
        throw new Error('Could not find matching group number');
    }

    return groupNumber;
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

    return {server, group: group.number, username};
}

async function getRdpDefaults() {
    // Read more here https://docs.microsoft.com/en-us/troubleshoot/windows-server/remote/remove-entries-from-remote-desktop-connection-computer#remove-entries-in-the-mac-remote-desktop-connection-client
    const recentServerRegistryKey = 'HKCU\\Software\\Microsoft\\Terminal Server Client\\Default';
    const registryResult = await regedit.promisified.list([recentServerRegistryKey]);
    const server = registryResult[recentServerRegistryKey].values.MRU0.value;

    return {server};
}

async function disconnectFromVpn() {
    try {
        // TODO: passing redundant values because it requires input.
        // TODO: Remove this when/if fixed in package (https://github.com/MarkTiedemann/cisco-vpn/issues/7).
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
        const rdpProcess = spawn('taskkill', ['/im', 'mstsc.exe']);
        rdpProcess.on('exit', () => resolve());
    });
}

module.exports.connectToVpn = connectToVpn;
module.exports.openRdpWindow = openRdpWindow;
module.exports.connectToVpnAndOpenRdp = connectToVpnAndOpenRdp;
module.exports.isCiscoVpnConnected = isCiscoVpnConnected;
module.exports.isRdpWindowOpened = isRdpWindowOpened;
module.exports.getAllCiscoVpnGroups = getAllCiscoVpnGroups;
module.exports.getCiscoVpnDefaults = getCiscoVpnDefaults;
module.exports.getRdpDefaults = getRdpDefaults;
module.exports.disconnectFromVpn = disconnectFromVpn;
module.exports.closeRdpWindow = closeRdpWindow;
