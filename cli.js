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

    Commands
      <none>            Connect to both VPN and RDP
      disconnect, d     Disconnect from both VPN and RDP
      status, s         Show connection statuses for VPN and RDP

    Options
      --setup, -s       Setup the credentials for Cisco VPN and Microsoft RDP
      --only-vpn, -o    Only connect to VPN
      --save            Used together with --only-vpn to change the default command behavior
`, {
	flags: {
		setup: {
			type: 'boolean',
			alias: 's'
		},
		onlyVpn: {
			type: 'boolean',
			alias: 'o'
		},
		save: {
			type: 'boolean'
		}
	}
});

const enabledCliFlags = Object.entries(cli.flags)
	.filter(flag => flag[1] === true)
	.map(flag => flag[0]);
const supportedFlags = new Set(['setup', 'onlyVpn', 'save']);
const inputHasUnsupportedFlags = enabledCliFlags.some(flag => !supportedFlags.has(flag));

// Show error if input is not valid
if (cli.input.length > 1 || inputHasUnsupportedFlags) {
	render(React.createElement(ErrorMessage, {
		message: 'Invalid input',
		commandSuggestion: '`cisco-vpn-rdp-connecter --help`',
		commandSuggestionSuffix: 'to show valid input.'
	}));

	process.exit(1);
}

const [command] = cli.input;

render(React.createElement(ui, {
	command,
	setup: cli.flags.setup,
	onlyVpn: cli.flags.onlyVpn,
	saveOnlyVpn: cli.flags.save
}));
