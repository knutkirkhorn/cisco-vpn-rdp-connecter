import React, {useState, useEffect} from 'react';
import Conf from 'conf';
import {useApp, useStdin} from 'ink';
import {
	connectToVpn,
	openRdpWindow,
	isCiscoVpnConnected,
	getCiscoVpnDefaults,
	getRdpDefaults
} from '../index.js';
import LoadingMessage from './LoadingMessage.js';
import SetupCredentials from './SetupCredentials.js';
import SuccessMessage from './SuccessMessage.js';
import ErrorMessage from './ErrorMessage.js';
import {Config, schema} from '../config.js';

const config = new Conf<Config>({projectName: 'cisco-vpn-rdp-connecter', schema});

type ConnectToVpnMessageProperties = {
	isCompleted: boolean;
	vpnGroup: string;
};

function ConnectToVpnMessage({isCompleted, vpnGroup}: ConnectToVpnMessageProperties) {
	return (
		<LoadingMessage
			isCompleted={isCompleted}
			loadingMessage={`Connecting to VPN (${vpnGroup})`}
			loadedMessage={`Connected to VPN (${vpnGroup})`}
		/>
	);
}

type OpeningRdpMessageProperties = {
	isCompleted: boolean;
};

function OpeningRdpMessage({isCompleted}: OpeningRdpMessageProperties) {
	return (
		<LoadingMessage
			isCompleted={isCompleted}
			loadingMessage="Opening Remote Desktop"
			loadedMessage="Opened Remote Desktop"
		/>
	);
}

type ConnecterProperties = {
	requestedSetup: boolean;
	onlyVpn: boolean;
};

export default function Connecter({requestedSetup, onlyVpn}: ConnecterProperties) {
	const [isConnectedToVpn, setIsConnectedToVpn] = useState(false);
	const [hasOpenedRdp, setHasOpenedRdp] = useState(false);
	const [credentials, setCredentials] = useState({
		vpn: {
			server: '',
			group: '',
			groupName: '',
			username: '',
			password: ''
		},
		rdp: {
			server: ''
		},
		onlyVpn: false
	});
	const [isCheckingSavedCredentials, setIsCheckingSavedCredentials] = useState(true);
	const [isSettingUpCredentials, setIsSettingUpCredentials] = useState(true);
	const [loadedPreviouslyUsedCredentials, setLoadedPreviouslyUsedCredentials] = useState(false);
	const [isIncorrectLoginDetails, setIsIncorrectLoginDetails] = useState(false);
	const [isConnectedToInternet, setIsConnectedToInternet] = useState(true);
	const [connectToOnlyVpn, setConnectToOnlyVpn] = useState(onlyVpn);
	const {exit} = useApp();
	const {setRawMode} = useStdin();

	useEffect(() => {
		const checkSavedCredentials = async () => {
			const vpnCredentials = config.get('vpn');
			const rdpCredentials = config.get('rdp');
			const savedOnlyVpn = config.get('onlyVpn');
			const isVpnConnected = await isCiscoVpnConnected();

			try {
				const ciscoVpnDefaults = isVpnConnected ? {
					server: '',
					group: '',
					username: ''
				} : await getCiscoVpnDefaults();
				const rdpDefaults = connectToOnlyVpn ? {
					server: ''
				} : await getRdpDefaults();

				setCredentials({
					vpn: {
						...vpnCredentials,
						server: ciscoVpnDefaults.server,
						group: ciscoVpnDefaults.group,
						username: ciscoVpnDefaults.username
					},
					rdp: {
						...rdpCredentials,
						server: rdpDefaults.server
					},
					onlyVpn: savedOnlyVpn
				});

				setIsCheckingSavedCredentials(false);

				// Return early if requested a new credential setup
				if (requestedSetup) {
					return;
				}

				// If all credentials are previously saved, skip the credential setup
				if ((vpnCredentials !== undefined
                    && rdpCredentials !== undefined
                    && !!vpnCredentials.server
                    && !!vpnCredentials.group
                    && !!vpnCredentials.username
                    && !!vpnCredentials.password
                    && !!rdpCredentials.server)
                    || isVpnConnected
				) {
					setIsSettingUpCredentials(false);
					setLoadedPreviouslyUsedCredentials(true);
				}
			} catch (error) {
				if (error instanceof Error && error.message === 'No internet connection') {
					setIsConnectedToInternet(false);
				}

				setIsCheckingSavedCredentials(false);
				setIsSettingUpCredentials(false);
				exit();
			}
		};
		checkSavedCredentials();
	}, [requestedSetup]);

	useEffect(() => {
		const checkCredentialsSetupAndConnectToVpn = async () => {
			if (isSettingUpCredentials) {
				return;
			}

			if (!isConnectedToInternet) {
				return;
			}

			const {
				server,
				group,
				username,
				password
			} = credentials.vpn;

			const isVpnAlreadyConnected = await isCiscoVpnConnected();

			if (isVpnAlreadyConnected) {
				setIsConnectedToVpn(true);
				return;
			}

			try {
				await connectToVpn(server, group, username, password);
				setIsConnectedToVpn(true);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === 'Incorrect login details') {
						setIsIncorrectLoginDetails(true);
						exit();
						return;
					}

					if (error.message === 'No internet connection') {
						setIsConnectedToInternet(false);
						exit();
						return;
					}

					if (error.message !== 'Already connected to VPN!') {
						throw error;
					}
				}

				setIsConnectedToVpn(true);
			}
		};
		checkCredentialsSetupAndConnectToVpn();
	}, [credentials, isSettingUpCredentials]);

	useEffect(() => {
		const checkConnectedToVpnAndOpenRdp = async () => {
			if (!isConnectedToVpn) {
				return;
			}

			if (!connectToOnlyVpn) {
				const {server} = credentials.rdp;
				await openRdpWindow(server);
				setHasOpenedRdp(true);
			}

			// TODO: remove this if I figure out how to fix that `mstsc.exe` prevents the CLI from exiting
			exit();
		};
		checkConnectedToVpnAndOpenRdp();
	}, [credentials, isConnectedToVpn]);

	const onSetupCompleted = (setupConfig: Config) => {
		// Save setup config
		config.set(setupConfig);

		setCredentials(setupConfig);
		setConnectToOnlyVpn(setupConfig.onlyVpn);
		setIsSettingUpCredentials(false);
	};

	if (isCheckingSavedCredentials) {
		/*
        TODO: without this it moves the input down a line after the `SelectInput` field.
        This makes the input in the setup not usable.
        Remove this when fixed.
        */
		setRawMode(true);
		return <LoadingMessage loadingMessage="Loading configs" />;
	}

	if (isSettingUpCredentials) {
		return (
			<SetupCredentials
				onComplete={onSetupCompleted}
				defaultCredentials={credentials}
			/>
		);
	}

	if (!isConnectedToInternet) {
		return (
			<ErrorMessage message="No internet connection" />
		);
	}

	if (isIncorrectLoginDetails) {
		return (
			<ErrorMessage
				message="Incorrect VPN login details"
				commandSuggestion="`cisco-vpn-rdp-connecter --setup`"
				commandSuggestionSuffix="to set login details."
			/>
		);
	}

	return (
		<>
			{loadedPreviouslyUsedCredentials ? (
				<SuccessMessage message="Loaded previously used setup" />
			) : (
				<SetupCredentials
					onComplete={onSetupCompleted}
					defaultCredentials={credentials}
				/>
			)}
			<ConnectToVpnMessage isCompleted={isConnectedToVpn} vpnGroup={credentials.vpn.groupName} />
			{isConnectedToVpn && (
				connectToOnlyVpn ? (
					<SuccessMessage message="Skipping Remote Desktop" />
				) : (
					<OpeningRdpMessage isCompleted={hasOpenedRdp} />
				)
			)}
		</>
	);
}
