const React = require('react');
const {useState, useEffect} = require('react');
const Conf = require('conf');
const importJsx = require('import-jsx');
const {useApp, useStdin} = require('ink');
const {
    connectToVpn,
    openRdpWindow,
    isCiscoVpnConnected,
    getCiscoVpnDefaults,
    getRdpDefaults
} = require('../index.js');

const LoadingMessage = importJsx('./LoadingMessage.js');
const SetupCredentials = importJsx('./SetupCredentials.js');
const SuccessMessage = importJsx('./SuccessMessage.js');
const ErrorMessage = importJsx('./ErrorMessage.js');
const config = new Conf();

const ConnectToVpnMessage = ({isCompleted}) => (
    <LoadingMessage
        isCompleted={isCompleted}
        loadingMessage="Connecting to VPN"
        loadedMessage="Connected to VPN"
    />
);

const OpeningRdpMessage = ({isCompleted}) => (
    <LoadingMessage
        isCompleted={isCompleted}
        loadingMessage="Opening Remote Desktop"
        loadedMessage="Opened Remote Desktop"
    />
);

const Connecter = ({requestedSetup, onlyVpn}) => {
    const [isConnectedToVpn, setIsConnectedToVpn] = useState(false);
    const [hasOpenedRdp, setHasOpenedRdp] = useState(false);
    const [credentials, setCredentials] = useState({
        vpn: {},
        rdp: {}
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
            const savedConfig = config.get();
            const {
                vpn: vpnCredentials,
                rdp: rdpCredentials
            } = savedConfig;
            const isVpnConnected = await isCiscoVpnConnected();

            try {
                const ciscoVpnDefaults = isVpnConnected ? {} : await getCiscoVpnDefaults();
                const rdpDefaults = connectToOnlyVpn ? {} : await getRdpDefaults();

                setCredentials({
                    vpn: {
                        server: ciscoVpnDefaults.server,
                        group: ciscoVpnDefaults.group,
                        username: ciscoVpnDefaults.username,
                        ...vpnCredentials
                    },
                    rdp: {
                        server: rdpDefaults.server,
                        ...rdpCredentials
                    }
                });

                setIsCheckingSavedCredentials(false);

                // Return early if requested a new credential setup
                if (requestedSetup) {
                    return;
                }

                // If all credentials are previously saved, skip the credential setup
                if ((typeof vpnCredentials !== 'undefined'
                    && typeof rdpCredentials !== 'undefined'
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
                if (error.message === 'No internet connection') {
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

    const onSetupCompleted = setupConfig => {
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
            <ConnectToVpnMessage isCompleted={isConnectedToVpn} />
            {isConnectedToVpn && (
                connectToOnlyVpn ? (
                    <SuccessMessage message="Skipping Remote Desktop" />
                ) : (
                    <OpeningRdpMessage isCompleted={hasOpenedRdp} />
                )
            )}
        </>
    );
};

module.exports = Connecter;
