/* eslint-disable react/require-default-props */
import React, {useEffect, useState} from 'react';
import Conf from 'conf';
import {isCiscoAnyConnectInstalled} from './index.js';
import Connecter from './components/Connecter.js';
import Disconnecter from './components/Disconnecter.js';
import ConnectionStatuses from './components/ConnectionStatuses.js';
import ErrorMessage from './components/ErrorMessage.js';
import LoadingMessage from './components/LoadingMessage.js';
import ConfigPrinter from './components/ConfigPrinter.js';
import {Config, schema} from './config.js';

const config = new Conf<Config>({projectName: 'cisco-vpn-rdp-connecter', schema});

type AppProperties = {
	command?: string;
	setup?: boolean;
	onlyVpn?: boolean;
	saveOnlyVpn?: boolean;
	showPassword?: boolean;
};

export default function App({
	command,
	setup: requestedSetup = false,
	onlyVpn = false,
	saveOnlyVpn = false,
	showPassword = false,
}: AppProperties) {
	const [hasCheckedVpnInstallation, setHasCheckedVpnInstallation] = useState(false);
	const [foundCiscoAnyConnectInstallation, setFoundCiscoAnyConnectInstallation] = useState<boolean>();

	useEffect(() => () => {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(0);
	}, []);

	useEffect(() => {
		async function checkVpnInstallation() {
			const isVpnInstalled = await isCiscoAnyConnectInstalled();
			setFoundCiscoAnyConnectInstallation(isVpnInstalled);
			setHasCheckedVpnInstallation(true);
		}
		checkVpnInstallation();
	}, []);

	if (!hasCheckedVpnInstallation) {
		return <LoadingMessage loadingMessage="Checking for Cisco AnyConnect installation" />;
	}

	if (!foundCiscoAnyConnectInstallation) {
		return <ErrorMessage message="Could not find any Cisco AnyConnect installation" />;
	}

	switch (command) {
		case undefined:
			// Change the behavior of the default command to only connect to VPN
			if (saveOnlyVpn && onlyVpn) {
				config.set('onlyVpn', true);
			}

			// eslint-disable-next-line no-case-declarations
			const savedOnlyVpn = config.get('onlyVpn');
			return <Connecter requestedSetup={requestedSetup} onlyVpn={onlyVpn || savedOnlyVpn} />;
		case 'd':
		case 'disconnect':
			return <Disconnecter />;
		case 's':
		case 'status':
			return <ConnectionStatuses onlyVpn={onlyVpn} />;
		case 'p':
		case 'print-config':
			return <ConfigPrinter showPassword={showPassword} />;
		default:
			return (
				<ErrorMessage
					message="Invalid input"
					commandSuggestion="`cisco-vpn-rdp-connecter --help`"
					commandSuggestionSuffix="to show valid input."
				/>
			);
	}
}
