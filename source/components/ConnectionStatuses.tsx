import React, {useState, useEffect} from 'react';
import {Text, useApp} from 'ink';
import logSymbols from 'log-symbols';
import {isRdpWindowOpened, isCiscoVpnConnected} from '../index.js';
import LoadingMessage from './LoadingMessage.js';

type StatusMessageProperties = {
	okStatus: boolean;
	type: string;
	message: string;
};

function StatusMessage({okStatus, type, message}: StatusMessageProperties) {
	return (
		<Text>{`${okStatus ? logSymbols.success : logSymbols.error} ${type}: ${message}`}</Text>
	);
}

type Properties = {
	onlyVpn: boolean;
};

export default function ConnectionStatuses({onlyVpn}: Properties) {
	const [isVpnConnected, setIsVpnConnected] = useState(false);
	const [isRdpOpened, setIsRdpOpened] = useState(false);
	const [hasCheckedStatuses, setHasCheckedStatuses] = useState(false);
	const {exit} = useApp();

	useEffect(() => {
		const checkStatuses = async () => {
			const vpnConnected = await isCiscoVpnConnected();
			setIsVpnConnected(vpnConnected);

			const rdpOpened = await isRdpWindowOpened();
			setIsRdpOpened(rdpOpened);

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
			<StatusMessage okStatus={isVpnConnected} type="VPN" message={isVpnConnected ? 'connected' : 'disconnected'} />
			{onlyVpn ? (
				<Text>- RDP: skipped check</Text>
			) : (
				<StatusMessage okStatus={isRdpOpened} type="RDP" message={isRdpOpened ? 'opened' : 'not opened'} />
			)}
		</>
	);
}