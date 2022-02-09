#!/usr/bin/env node

'use strict';

// TODO: convert to ESM when https://github.com/vadimdemedes/import-jsx/issues/15 is fixed

const importJsx = require('import-jsx');
const {render} = require('ink');
const meow = require('meow');
const React = require('react');

const ui = importJsx('./ui.js');

const cli = meow(`
    Usage
      $ cisco-vpn-rdp-connecter

    Options
      --disconnect, -d  Disconnect from both VPN and RDP
      --setup, -s       Setup the credentials for Cisco VPN and Microsoft RDP
`, {
    flags: {
        setup: {
            type: 'boolean',
            alias: 's'
        },
        disconnect: {
            type: 'boolean',
            alias: 'd'
        }
    }
});

render(React.createElement(ui, {
    setup: cli.flags.setup,
    disconnect: cli.flags.disconnect
}));
