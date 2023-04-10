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
export function connectToVpn(server: string, group: string, username: string, password: string): Promise<void>;

/**
Open a Microsoft Remote Desktop window.
@param server

@example
```
import {openRdpWindow} from 'cisco-vpn-rdp-connecter';

await openRdpWindow('rdp-server');
```
*/
export function openRdpWindow(server: string): Promise<void>;

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
export function connectToVpnAndOpenRdp(vpnCredentials: CiscoVpnCredentials, rdpServer: string): Promise<void>;

/**
Check if Cisco VPN is installed.

@example
```
import {isCiscoAnyConnectInstalled} from 'cisco-vpn-rdp-connecter';

console.log(await isCiscoAnyConnectInstalled());
// => true
```
*/
export function isCiscoAnyConnectInstalled(): Promise<boolean>;

/**
Check if Cisco VPN is connected.

@example
```
import {isCiscoVpnConnected} from 'cisco-vpn-rdp-connecter';

console.log(await isCiscoVpnConnected());
// => true
```
*/
export function isCiscoVpnConnected(): Promise<boolean>;

/**
Check if a Microsoft Remote Desktop window is open.

@example
```
import {isRdpWindowOpened} from 'cisco-vpn-rdp-connecter';

console.log(await isRdpWindowOpened());
// => true
```
*/
export function isRdpWindowOpened(): Promise<boolean>;

interface CiscoVpnGroup {
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
export function getAllCiscoVpnGroups(server: string): Promise<CiscoVpnGroup[]>;

interface CiscoVpnDefaults {
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
export function getCiscoVpnDefaults(): Promise<CiscoVpnDefaults>;

interface RdpDefaults {
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
export function getRdpDefaults(): Promise<RdpDefaults>;

/**
Disconnect from Cisco AnyConnect VPN.

@example
```
import {disconnectFromVpn} from 'cisco-vpn-rdp-connecter';

await disconnectFromVpn();
```
*/
export function disconnectFromVpn(): Promise<void>;

/**
Close the Microsoft Remote Desktop window.

@example
```
import {closeRdpWindow} from 'cisco-vpn-rdp-connecter';

await closeRdpWindow();
```
*/
export function closeRdpWindow(): Promise<void>;
