import React, {useState, useEffect} from 'react';
import {Text, useApp} from 'ink';
import logSymbols from 'log-symbols';
import Conf from 'conf';
import {isRdpWindowOpened, isCiscoVpnConnected} from '../index.js';
import LoadingMessage from './LoadingMessage.js';
import {Config, schema} from '../config.js';

const config = new Conf<Config>({projectName: 'cisco-vpn-rdp-connecter', schema});

type StatusMessageProperties = {
	okStatus: boolean;
	type: string;
	message: string;
	// eslint-disable-next-line react/require-default-props
	extra?: string;
};

function StatusMessage({
	okStatus, type, message, extra
}: StatusMessageProperties) {
	return (
		<Text>
			{`${okStatus ? logSymbols.success : logSymbols.error} ${type}: ${message}`}
			{`${extra ? ` (${extra})` : ''}`}
		</Text>
	);
}

type Properties = {
	onlyVpn: boolean;
};

export default function ConnectionStatuses({onlyVpn}: Properties) {
	const [isVpnConnected, setIsVpnConnected] = useState(false);
	const [isRdpOpened, setIsRdpOpened] = useState(false);
	const [hasCheckedStatuses, setHasCheckedStatuses] = useState(false);
	const [vpnGroupName, setVpnGroupName] = useState('');
	const {exit} = useApp();

	useEffect(() => {
		const checkStatuses = async () => {
			const vpnConfig = config.get('vpn');
			setVpnGroupName(vpnConfig.groupName);

			const connectionStatusPromises = [isCiscoVpnConnected(), isRdpWindowOpened()];
			const [vpnConnected, rdpOpened] = await Promise.all(connectionStatusPromises);
			setIsVpnConnected(vpnConnected as boolean);
			setIsRdpOpened(rdpOpened as boolean);

			setHasCheckedStatuses(true);
			exit();
		};
		checkStatuses();
	}, []);

	if (!hasCheckedStatuses) {
		return <LoadingMessage isCompleted={hasCheckedStatuses} loadingMessage="Checking statuses" />;
	}

	return (
		<>
			<StatusMessage
				okStatus={isVpnConnected}
				type="VPN"
				message={isVpnConnected ? 'connected' : 'disconnected'}
				extra={isVpnConnected ? vpnGroupName : ''}
			/>
			{onlyVpn ? (
				<Text>- RDP: skipped check</Text>
			) : (
				<StatusMessage okStatus={isRdpOpened} type="RDP" message={isRdpOpened ? 'opened' : 'not opened'} />
			)}
		</>
	);
}
