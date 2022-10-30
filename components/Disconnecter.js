const React = require('react');
const {useState, useEffect} = require('react');
const importJsx = require('import-jsx');
const {useApp} = require('ink');
const {disconnectFromVpn, closeRdpWindow} = require('../index.js');

const LoadingMessage = importJsx('./LoadingMessage.js');

const STEPS = {
	RDP: 0,
	VPN: 1
};

const Disconnecter = () => {
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
};

module.exports = Disconnecter;
