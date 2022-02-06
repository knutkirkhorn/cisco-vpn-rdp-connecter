# cisco-vpn-rdp-connecter
> Connect to Cisco AnyConnect VPN and open a Microsoft Remote Desktop (RDP) window

## CLI
### Install
```sh
npm install --global cisco-vpn-rdp-connecter
```

### Usage
```
$ cisco-vpn-rdp-connecter --help
    Usage
      $ cisco-vpn-rdp-connecter

    Options
      --disconnect, -d  Disconnect from both VPN and RDP
      --setup, -s       Setup the credentials for Cisco VPN and Microsoft RDP
```

## API
### Install
```sh
npm install cisco-vpn-rdp-connecter
```

### Usage
```js
const {connectToVpnAndOpenRdp} = require('cisco-vpn-rdp-connecter');

const vpnCredentials = {
    server: 'server.name',
    group: '1',
    username: 'knut',
    password: 'super_secure_password'
};
const rdpServer = 'rdp.server.name';

(async () => {
    await connectToVpnAndOpenRdp(vpnCredentials, rdpServer);
})();
```

### Exports
#### connectToVpnAndOpenRdp(vpnCredentials, rdpServer)
#### connectToVpn(server, group, username, password)
#### openRdpWindow(server)
#### isCiscoVpnConnected()
#### getCiscoVpnDefaults()
#### getRdpDefaults()
#### disconnectFromVpn()
#### closeRdpWindow()
