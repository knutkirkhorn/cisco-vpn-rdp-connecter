import React, {useState, useEffect} from 'react';
import {useApp} from 'ink';
import {disconnectFromVpn, closeRdpWindow} from '../index.js';
import LoadingMessage from './LoadingMessage.js';

const STEPS = {
	RDP: 0,
	VPN: 1
};

export default function Disconnecter() {
	const [isDisconnectedFromVpn, setIsDisconnectedFromVpn] = useState(false);
	const [hasClosedRdpWindow, setHasClosedRdpWindow] = useState(false);
	const [step, setStep] = useState(STEPS.RDP);
	const {exit} = useApp();

	useEffect(() => {
		const disconnectVpnAndCloseRdpWindow = async () => {
			// Close the RDP window
			await closeRdpWindow();
			setHasClosedRdpWindow(true);
			setStep(STEPS.VPN);

			// Disconnect from VPN
			await disconnectFromVpn();
			setIsDisconnectedFromVpn(true);
			exit();
		};
		disconnectVpnAndCloseRdpWindow();
	}, []);

	return (
		<>
			{step >= STEPS.RDP && (
				<LoadingMessage
					isCompleted={hasClosedRdpWindow}
					loadingMessage="Closing RDP window"
					loadedMessage="Closed RDP window"
				/>
			)}
			{step >= STEPS.VPN && (
				<LoadingMessage
					isCompleted={isDisconnectedFromVpn}
					loadingMessage="Disconnecting from VPN"
					loadedMessage="Disconnected from VPN"
				/>
			)}
		</>
	);
}
