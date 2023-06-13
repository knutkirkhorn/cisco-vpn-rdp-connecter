import React, {useState, useEffect} from 'react';
import Conf from 'conf';
import {Text} from 'ink';
import logSymbols from 'log-symbols';
import LoadingMessage from './LoadingMessage.js';
import ErrorMessage from './ErrorMessage.js';
import {Config, schema} from '../config.js';

const config = new Conf<Config>({projectName: 'cisco-vpn-rdp-connecter', schema});

type TextConfigProperties = {
	name: string;
	value: string;
	// eslint-disable-next-line react/require-default-props
	isMasked?: boolean;
};

function TextConfig({name, value, isMasked = false}: TextConfigProperties) {
	const textValue = isMasked ? '*'.repeat(value.length) : value;

	return (
		<Text>{`${name}: ${textValue}`}</Text>
	);
}

export default function ConfigPrinter({showPassword = false}) {
	const [savedConfig, setSavedConfig] = useState<Config>();
	const [vpnGroupText, setVpnGroupText] = useState<string>();
	const [isConfigNotSet, setIsConfigNotSet] = useState(false);

	useEffect(() => {
		const loadConfig = async () => {
			const vpnConfig = config.get('vpn');
			const rdpConfig	= config.get('rdp');
			const onlyVpn = config.get('onlyVpn');

			// Check if config is empty
			if (!vpnConfig || !rdpConfig || onlyVpn === undefined) {
				setIsConfigNotSet(true);
				return;
			}

			setSavedConfig({
				vpn: vpnConfig,
				rdp: rdpConfig,
				onlyVpn,
			});

			const vpnGroupName = vpnConfig.groupName || 'Default';
			setVpnGroupText(`${vpnGroupName} (${vpnConfig.group})`);
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
}
