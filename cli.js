#!/usr/bin/env node

import {render} from 'ink';
import meow from 'meow';
import React from 'react';
import ui from './ui.js';
import ErrorMessage from './components/ErrorMessage.js';

const cli = meow(`
	Usage
      $ cisco-vpn-rdp-connecter

	Commands
	  <none>            Connect to both VPN and RDP
	  disconnect, d     Disconnect from both VPN and RDP
	  status, s         Show connection statuses for VPN and RDP
	  print-config, p   Print the VPN and RDP config

	Options
	  --setup, -s       Setup the credentials for Cisco VPN and Microsoft RDP
	  --only-vpn, -o    Only connect to VPN
	  --save            Used together with --only-vpn to change the default command behavior
	  --show-password   Show password in plain text when printing the password
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
		},
		showPassword: {
			type: 'boolean'
		}
	},
	importMeta: import.meta
});

const enabledCliFlags = Object.entries(cli.flags)
	.filter(flag => flag[1] === true)
	.map(flag => flag[0]);
const supportedFlags = new Set(['setup', 'onlyVpn', 'save', 'showPassword']);
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
	saveOnlyVpn: cli.flags.save,
	showPassword: cli.flags.showPassword
}));
