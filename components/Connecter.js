const React = require('react');
const {useState, useEffect} = require('react');
const Conf = require('conf');
const importJsx = require('import-jsx');
const {Text, Box} = require('ink');
const logSymbols = require('log-symbols');
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

const Connecter = ({requestedSetup}) => {
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

    useEffect(() => {
        const checkSavedCredentials = async () => {
            const savedCredentials = config.get();
            const {vpn: vpnCredentials} = savedCredentials;
            const {rdp: rdpCredentials} = savedCredentials;

            const isVpnConnected = await isCiscoVpnConnected();
            const ciscoVpnDefaults = isVpnConnected ? {} : await getCiscoVpnDefaults();
            const rdpDefaults = await getRdpDefaults();

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
            if ((!!vpnCredentials.server
                && !!vpnCredentials.group
                && !!vpnCredentials.username
                && !!vpnCredentials.password
                && !!rdpCredentials.server)
                || isVpnConnected
            ) {
                setIsSettingUpCredentials(false);
                setLoadedPreviouslyUsedCredentials(true);
            }
        };
        checkSavedCredentials();
    }, [requestedSetup]);

    useEffect(() => {
        const checkCredentialsSetupAndConnectToVpn = async () => {
            if (isSettingUpCredentials) {
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

            const {server} = credentials.rdp;
            await openRdpWindow(server);
            setHasOpenedRdp(true);

            // TODO: remove this if I figure out how to fix that `mstsc.exe` prevents the CLI from exiting
            process.exit();
        };
        checkConnectedToVpnAndOpenRdp();
    }, [credentials, isConnectedToVpn]);

    const onCredentialsSet = inputCredentials => {
        // Save credentials for both VPN and RDP
        config.set('vpn', inputCredentials.vpn);
        config.set('rdp', inputCredentials.rdp);

        setCredentials(inputCredentials);
        setIsSettingUpCredentials(false);
    };

    if (isCheckingSavedCredentials) {
        return <LoadingMessage loadingMessage="Loading configs" />;
    }

    if (isSettingUpCredentials) {
        return (
            <SetupCredentials
                onComplete={onCredentialsSet}
                defaultCredentials={credentials}
            />
        );
    }

    if (isIncorrectLoginDetails) {
        return (
            <Box flexDirection="column">
                <Text color="redBright" bold>
                    {logSymbols.error}
                    {' '}
                    Incorrect VPN login details
                </Text>
                <Text>
                    Use
                    {' '}
                    <Text dimColor>`cisco-vpn-rdp-connecter --setup`</Text>
                    {' '}
                    to set login details.
                </Text>
            </Box>
        );
    }

    return (
        <>
            {loadedPreviouslyUsedCredentials ? (
                <SuccessMessage message="Loaded previously used setup" />
            ) : (
                <SetupCredentials
                    onComplete={onCredentialsSet}
                    defaultCredentials={credentials}
                />
            )}
            <ConnectToVpnMessage isCompleted={isConnectedToVpn} />
            {isConnectedToVpn && (
                <OpeningRdpMessage isCompleted={hasOpenedRdp} />
            )}
        </>
    );
};

module.exports = Connecter;
