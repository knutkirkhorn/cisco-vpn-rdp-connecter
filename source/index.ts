import fs, {readFile} from 'node:fs/promises';
import {spawn, exec} from 'node:child_process';
import {homedir} from 'node:os';
import path from 'node:path';
import ciscoVpn from 'cisco-vpn';
import {Element, xml2js} from 'xml-js';
import regedit from 'regedit';
import isOnline from 'is-online';
import psList from 'ps-list';
import sqlite3 from 'sqlite3';

const ciscoVpnCliPaths = {
	win32: 'C:/Program Files (x86)/Cisco/Cisco AnyConnect Secure Mobility Client/vpncli.exe',
	darwin: '/opt/cisco/anyconnect/bin/vpn',
};

/**
Connect to Cisco AnyConnect VPN.
@param server
@param group
@param username
@param password

@example
```
import {connectToVpn} from 'cisco-vpn-rdp-connecter';

await connectToVpn('example-server', '1', 'knut', 'supersecret');
```
*/
export async function connectToVpn(server: string, group: string, username: string, password: string) {
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

	const ciscoVpnCliPath = ciscoVpnCliPaths[process.platform as keyof typeof ciscoVpnCliPaths];

	if (!ciscoVpnCliPath) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	const vpn = ciscoVpn({
		server,
		username: combinedVpnGroupAndUsername,
		password,
		exe: ciscoVpnCliPath,
	});

	try {
		await vpn.connect();
	} catch (error) {
		if (error instanceof Error) {
			const trimmedErrorMessage = error.message.replaceAll('VPN>', '').trim();

			if (process.platform === 'darwin') {
				// If macOS, response ends with both connected and connect to <server>
				// So check next last line if it says disconnected

				if (trimmedErrorMessage?.split('\n')?.length < 2) return;

				const nextLastLine = trimmedErrorMessage
					?.split('\n')[(trimmedErrorMessage?.split('\n')?.length ?? 2) - 2]
					?.trim();

				if (nextLastLine === '>> state: Connected') return;
			}

			const isIncorrectLoginDetails = trimmedErrorMessage.endsWith('Login failed.');
			if (isIncorrectLoginDetails) {
				throw new Error('Incorrect login details');
			}

			const vpnCliConnectedMessage = `>> notice: Connected to ${server}.`;
			const isVpnConnectedRegex = /(.*)>> error: connect not available. another anyconnect application is running(\r)+\nor this functionality was not requested by this application./gi;
			const isVpnAlreadyConnected = trimmedErrorMessage.endsWith(vpnCliConnectedMessage) || trimmedErrorMessage.match(isVpnConnectedRegex);

			throw isVpnAlreadyConnected
				? new Error('Already connected to VPN!')
				: error;
		}
	}
}

/**
Open a Microsoft Remote Desktop window.
@param server

@example
```
import {openRdpWindow} from 'cisco-vpn-rdp-connecter';

await openRdpWindow('rdp-server');
```
*/
export async function openRdpWindow(server: string) {
	// Require that all credentials are set
	if (server === undefined) {
		throw new Error('`server` is required');
	}

	const rdpCommands = {
		win32: {
			command: 'cmd.exe',
			args: ['/c', 'start', 'mstsc.exe', `/v:${server}`],
		},
		darwin: {
			command: 'open',
			args: ['/Applications/Microsoft Remote Desktop.app'],
		},
	};

	if (!(process.platform in rdpCommands)) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	const {command, args} = rdpCommands[process.platform as keyof typeof rdpCommands];

	// Open RDP window
	return new Promise<void>(resolve => {
		// Needs to promisify `spawn` because `spawnSync` does not return after starting `mstsc`
		const rdpProcess = spawn(command, args);
		rdpProcess.on('exit', () => resolve());
	});
}

interface CiscoVpnCredentials {
	server: string,
	group: string,
	username: string,
	password: string
}

/**
Connect to Cisco AnyConnect VPN and open a Microsoft Remote Desktop window.
@param vpnCredentials
@param rdpServer

@example
```
import {connectToVpnAndOpenRdp} from 'cisco-vpn-rdp-connecter';

const vpnCredentials = {
	server: 'example-server',
	group: '1',
	username: 'knut',
	password: 'supersecret'
};
await connectToVpnAndOpenRdp(vpnCredentials, 'rdp-server');
```
*/
export async function connectToVpnAndOpenRdp(vpnCredentials: CiscoVpnCredentials, rdpServer: string) {
	await connectToVpn(vpnCredentials.server, vpnCredentials.group, vpnCredentials.username, vpnCredentials.password);
	await openRdpWindow(rdpServer);
}

/**
Check if Cisco VPN is connected.

@example
```
import {isCiscoVpnConnected} from 'cisco-vpn-rdp-connecter';

console.log(await isCiscoVpnConnected());
// => true
```
*/
export async function isCiscoVpnConnected(): Promise<boolean> {
	const ciscoVpnCliPath = ciscoVpnCliPaths[process.platform as keyof typeof ciscoVpnCliPaths];

	if (!ciscoVpnCliPath) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	return new Promise((resolve, reject) => {
		exec(`"${ciscoVpnCliPath}" stats`, (error, stdout) => {
			if (error) {
				return reject(error);
			}

			const returnMessage = stdout.toString();
			const vpnState = returnMessage.trim()
				?.match(/(.*)connection state:(.*)/gi)
				?.find(match => !match.includes('management'))
				?.trim()
				.split(':')[1]
				?.trim();

			return resolve(vpnState === 'Connected');
		});
	});
}

/**
Check if a Microsoft Remote Desktop window is open.

@example
```
import {isRdpWindowOpened} from 'cisco-vpn-rdp-connecter';

console.log(await isRdpWindowOpened());
// => true
```
*/
export async function isRdpWindowOpened(): Promise<boolean> {
	if (process.platform === 'darwin') {
		const processList = await psList();
		return processList.some(app => app.cmd === '/Applications/Microsoft Remote Desktop.app/Contents/MacOS/Microsoft Remote Desktop');
	}

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

/**
Check if Cisco VPN is installed.

@example
```
import {isCiscoAnyConnectInstalled} from 'cisco-vpn-rdp-connecter';

console.log(await isCiscoAnyConnectInstalled());
// => true
```
*/
export async function isCiscoAnyConnectInstalled() {
	const ciscoVpnCliPath = ciscoVpnCliPaths[process.platform as keyof typeof ciscoVpnCliPaths];

	if (!ciscoVpnCliPath) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	try {
		const stats = await fs.stat(ciscoVpnCliPath);
		return stats.isFile();
	} catch {
		return false;
	}
}

export interface CiscoVpnGroup {
	number: string,
	name: string
}

/**
Get all Cisco VPN groups for a given server.

@example
```
import {getAllCiscoVpnGroups} from 'cisco-vpn-rdp-connecter';

console.log(await getAllCiscoVpnGroups('example-server'));
// => [
// 	{
// 		number: '0'
// 		name: 'Example group'
// 	}
// ]
```
*/
export async function getAllCiscoVpnGroups(server: string): Promise<CiscoVpnGroup[]> {
	if (server === undefined) {
		throw new Error('`server` is required');
	}

	// Check if internet is not connected
	const hasInternetConnection = await isOnline();

	if (!hasInternetConnection) {
		throw new Error('No internet connection');
	}

	const ciscoVpnCliPath = ciscoVpnCliPaths[process.platform as keyof typeof ciscoVpnCliPaths];

	return new Promise(resolve => {
		const vpnProcess = spawn(ciscoVpnCliPath, ['connect', server]);

		// Default to group `0` if it fails to start `connect` (already connected to VPN)
		const defaultGroup: CiscoVpnGroup[] = [
			{
				number: '0',
				name: 'Default',
			},
		];
		vpnProcess.on('close', () => resolve(defaultGroup));

		vpnProcess.stdout.on('data', (data: string) => {
			if (!data.includes('Group: ')) {
				return;
			}

			const untrimmedGroupLines = data.toString().trim()
				.replaceAll('>> Please enter your username and password.', '');

			vpnProcess.kill();
			const groupLines = untrimmedGroupLines.trim().split('\n');
			const groupLineRegex = /(\d+)\)(.*)/;
			const groups: CiscoVpnGroup[] = groupLines
				.map(groupLine => groupLine.trim())
				.filter(groupLine => groupLine.match(groupLineRegex))
				.map(groupLine => {
					const groupLineData = groupLine.split(') ');
					const [number, name] = groupLineData;
					return {
						number,
						name,
					};
				})
				.filter(group => group.number !== undefined && group.name !== undefined) as CiscoVpnGroup[];
			// eslint-disable-next-line consistent-return
			return resolve(groups);
		});
	});
}

async function convertGroupToGroupNumber(server: string, group: string) {
	if (server === undefined || group === undefined) {
		throw new Error('Both `server` and `group` is required');
	}

	// If it's already a number, just return it
	if (typeof group === 'number') {
		return group;
	}

	const ciscoVpnGroups = await getAllCiscoVpnGroups(server);
	const groupObject = ciscoVpnGroups.find(vpnGroup => vpnGroup.name === group);

	if (groupObject === undefined || groupObject.number === undefined) {
		throw new Error('Could not find matching group number');
	}

	return groupObject.number;
}

export interface CiscoVpnDefaults {
	server: string,
	group: string,
	username: string
}

/**
Get the default/recent used Cisco VPN settings.

@example
```
import {getCiscoVpnDefaults} from 'cisco-vpn-rdp-connecter';

console.log(await getCiscoVpnDefaults());
// => {
// 	server: 'example-server',
// 	group: '1',
// 	username: 'knut'
// }
```
*/
export async function getCiscoVpnDefaults(): Promise<CiscoVpnDefaults> {
	let filePath = '';

	if (process.platform === 'win32') {
		// eslint-disable-next-line dot-notation
		if (process.env['APPDATA'] === undefined) {
			throw new Error('`APPDATA` environment variable is undefined');
		}

		// eslint-disable-next-line dot-notation
		filePath = path.join(process.env['APPDATA'], '..\\Local\\Cisco\\Cisco AnyConnect Secure Mobility Client\\preferences.xml');
	} else if (process.platform === 'darwin') {
		filePath = path.join(homedir(), '.anyconnect');
	}

	if (!filePath) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	const xmlFile = await readFile(filePath, 'utf8');
	const anyConnectXmlElement: Element = xml2js(xmlFile).elements[0];
	const anyConnectElements = anyConnectXmlElement.elements;

	if (!anyConnectElements) {
		// TODO: throw here or default to something?
		throw new Error('Could not find any Cisco VPN settings');
	}

	const serverElements = anyConnectElements.find((element: Element) => element.name === 'DefaultHostName')?.elements;
	const server = serverElements?.[0]?.text as string;

	const groupTextElements = anyConnectElements.find((element: Element) => element.name === 'DefaultGroup')?.elements;
	const groupText = groupTextElements?.[0]?.text as string; // TODO: can this be a number?
	const usernameElements = anyConnectElements.find((element: Element) => element.name === 'DefaultUser')?.elements;
	const username = usernameElements?.[0]?.text as string;
	const groupNumber = await convertGroupToGroupNumber(server, groupText);
	return {server, group: groupNumber, username};
}

export interface RdpDefaults {
	server: string
}

/**
Get the default/recent used RDP settings for Microsoft Remote Desktop.

@example
```
import {getRdpDefaults} from 'cisco-vpn-rdp-connecter';

console.log(await getRdpDefaults());
// => {
// 	server: 'example-server'
// }
```
*/
export async function getRdpDefaults(): Promise<RdpDefaults> {
	if (process.platform === 'darwin') {
		const rdpSqliteDatabasePath = path.join(
			homedir(),
			'/Library/Containers/com.microsoft.rdc.macos/Data/Library/Application Support/com.microsoft.rdc.macos/com.microsoft.rdc.application-data.sqlite',
		);
		const database = new sqlite3.Database(rdpSqliteDatabasePath);
		const server = await new Promise((resolve, reject) => {
			// Return the hostname for the first saved RDP connection
			database.get('SELECT ZHOSTNAME FROM ZBOOKMARKENTITY LIMIT 1', (error, row: {ZHOSTNAME: string}) => {
				if (error) return reject(error);

				const {ZHOSTNAME: host} = row;
				return resolve(host);
			});
		}) as string;
		return {server};
	}

	// Read more here https://docs.microsoft.com/en-us/troubleshoot/windows-server/remote/remove-entries-from-remote-desktop-connection-computer#remove-entries-in-the-mac-remote-desktop-connection-client
	const recentServerRegistryKey = 'HKCU\\Software\\Microsoft\\Terminal Server Client\\Default';
	const registryResult = await regedit.promisified.list([recentServerRegistryKey]);
	// eslint-disable-next-line dot-notation
	const server = registryResult[recentServerRegistryKey]?.values['MRU0']?.value as string;

	return {server};
}

/**
Disconnect from Cisco AnyConnect VPN.

@example
```
import {disconnectFromVpn} from 'cisco-vpn-rdp-connecter';

await disconnectFromVpn();
```
*/
export async function disconnectFromVpn() {
	try {
		const ciscoVpnCliPath = ciscoVpnCliPaths[process.platform as keyof typeof ciscoVpnCliPaths];

		if (!ciscoVpnCliPath) {
			throw new Error(`Unsupported architecture \`${process.platform}\``);
		}

		// TODO: passing redundant values because it requires input.
		// TODO: Remove this when/if fixed in package (https://github.com/MarkTiedemann/cisco-vpn/issues/7).
		await ciscoVpn({
			server: 'noop',
			username: 'noop',
			password: 'noop',
			exe: ciscoVpnCliPath,
		}).disconnect();
	} catch (error) {
		if (error instanceof Error) {
			// Check if the VPN client is not connected
			const trimmedErrorMessage = error.message.replaceAll('VPN>', '').trim();
			const isVpnAlreadyDisconnected = trimmedErrorMessage.endsWith('The VPN client is not connected.');

			if (process.platform === 'darwin') {
				if (trimmedErrorMessage?.split('\n')?.length < 2) return;

				// If macOS, response ends with both disconnected and ready to connect
				// So check next last line if it says disconnected
				const nextLastLine = trimmedErrorMessage
					?.split('\n')[trimmedErrorMessage.split('\n').length - 2]
					?.trim();

				if (nextLastLine === '>> state: Disconnected') return;
			}

			if (!isVpnAlreadyDisconnected) {
				throw error;
			}
		}
	}
}

/**
Close the Microsoft Remote Desktop window.

@example
```
import {closeRdpWindow} from 'cisco-vpn-rdp-connecter';

await closeRdpWindow();
```
*/
export async function closeRdpWindow() {
	const rdpCloseCommands = {
		win32: {
			command: 'taskkill',
			args: ['/im', 'mstsc.exe'],
		},
		darwin: {
			command: 'pkill',
			args: ['Microsoft Remote Desktop'],
		},
	};

	if (!(process.platform in rdpCloseCommands)) {
		throw new Error(`Unsupported architecture \`${process.platform}\``);
	}

	const {command, args} = rdpCloseCommands[process.platform as keyof typeof rdpCloseCommands];

	return new Promise<void>(resolve => {
		const rdpProcess = spawn(command, args);
		rdpProcess.on('exit', () => resolve());
	});
}
