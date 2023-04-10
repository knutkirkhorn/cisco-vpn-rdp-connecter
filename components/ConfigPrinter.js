import React, {useState, useEffect} from 'react';
import Conf from 'conf';
import {Text} from 'ink';
import logSymbols from 'log-symbols';
import {getAllCiscoVpnGroups} from '../index.js';
import LoadingMessage from './LoadingMessage.js';
import ErrorMessage from './ErrorMessage.js';

const config = new Conf();

const TextConfig = ({name, value, isMasked = false}) => {
	const textValue = isMasked ? '*'.repeat(value.length) : value;

	return (
		<Text>{`${name}: ${textValue}`}</Text>
	);
};

const ConfigPrinter = ({showPassword = false}) => {
	const [savedConfig, setSavedConfig] = useState();
	const [vpnGroupText, setVpnGroupText] = useState();
	const [isConfigNotSet, setIsConfigNotSet] = useState(false);

	useEffect(() => {
		const loadConfig = async () => {
			const currentConfig = config.get();

			// Check if config is empty
			if (Object.entries(currentConfig).length === 0) {
				setIsConfigNotSet(true);
				return;
			}

			setSavedConfig(currentConfig);

			const ciscoVpnGroups = await getAllCiscoVpnGroups(currentConfig.vpn.server);
			const currentVpnGroup = ciscoVpnGroups.find(
				vpnGroup => vpnGroup.number === currentConfig.vpn.group
			) || {number: currentConfig.vpn.group, name: 'Default'};
			setVpnGroupText(`${currentVpnGroup.name} (${currentConfig.vpn.group})`);
		};
		loadConfig();
	}, []);

	if (isConfigNotSet) {
		return <ErrorMessage message="Config is not set" />;
	}

	if (!savedConfig || !vpnGroupText) {
		return <LoadingMessage loadingMessage="Loading config" />;
	}

	return (
		<>
			<TextConfig name="VPN server" value={savedConfig.vpn.server} />
			<TextConfig name="Group" value={vpnGroupText} />
			<TextConfig name="Username" value={savedConfig.vpn.username} />
			<TextConfig name="Password" value={savedConfig.vpn.password} isMasked={!showPassword} />
			<TextConfig name="RDP server" value={savedConfig.rdp.server} />
			<TextConfig name="Only connect to VPN" value={savedConfig.onlyVpn ? logSymbols.success : logSymbols.error} />
		</>
	);
};

export default ConfigPrinter;
