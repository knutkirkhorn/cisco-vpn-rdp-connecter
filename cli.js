#!/usr/bin/env node

'use strict';

// TODO: convert to ESM when https://github.com/vadimdemedes/import-jsx/issues/15 is fixed

const importJsx = require('import-jsx');
const {render} = require('ink');
const meow = require('meow');
const React = require('react');

const ui = importJsx('./ui.js');
const ErrorMessage = importJsx('./components/ErrorMessage.js');

const cli = meow(`
    Usage
      $ cisco-vpn-rdp-connecter

    Options
      --disconnect, -d  Disconnect from both VPN and RDP
      --setup, -s       Setup the credentials for Cisco VPN and Microsoft RDP
      --status          Show connection statuses for VPN and RDP
`, {
    flags: {
        setup: {
            type: 'boolean',
            alias: 's'
        },
        disconnect: {
            type: 'boolean',
            alias: 'd'
        },
        status: {
            type: 'boolean'
        }
    }
});

const enabledCliFlags = Object.entries(cli.flags).filter(flag => flag[1] === true);

// Show error if multiple CLI flags are set
if (enabledCliFlags.length > 1) {
    render(React.createElement(ErrorMessage, {
        message: 'Multiple CLI flags are not allowed',
        commandSuggestion: '`cisco-vpn-rdp-connecter --help`',
        commandSuggestionSuffix: 'to show valid flags.'
    }));

    process.exit(1);
}

// Show error if input is not valid
if (cli.input.length > 0) {
    render(React.createElement(ErrorMessage, {
        message: 'Invalid input',
        commandSuggestion: '`cisco-vpn-rdp-connecter --help`',
        commandSuggestionSuffix: 'to show valid input.'
    }));

    process.exit(1);
}

render(React.createElement(ui, {
    setup: cli.flags.setup,
    disconnect: cli.flags.disconnect,
    showConnectionStatuses: cli.flags.status
}));
