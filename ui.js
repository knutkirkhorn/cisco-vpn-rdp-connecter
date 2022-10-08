const React = require('react');
const importJsx = require('import-jsx');
const {useEffect, useState} = require('react');
const {isCiscoAnyConnectInstalled} = require('./index.js');

const Connecter = importJsx('./components/Connecter.js');
const Disconnecter = importJsx('./components/Disconnecter.js');
const ConnectionStatuses = importJsx('./components/ConnectionStatuses.js');
const ErrorMessage = importJsx('./components/ErrorMessage.js');
const LoadingMessage = importJsx('./components/LoadingMessage.js');

const App = ({command, setup: requestedSetup, onlyVpn}) => {
    const [hasCheckedVpnInstallation, setHasCheckedVpnInstallation] = useState(false);
    const [foundCiscoAnyConnectInstallation, setFoundCiscoAnyConnectInstallation] = useState();

    useEffect(() => () => {
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
    }, []);

    useEffect(async () => {
        const isVpnInstalled = await isCiscoAnyConnectInstalled();
        setFoundCiscoAnyConnectInstallation(isVpnInstalled);
        setHasCheckedVpnInstallation(true);
    }, []);

    if (!hasCheckedVpnInstallation) {
        return <LoadingMessage loadingMessage="Checking for Cisco AnyConnect installation" />;
    }

    if (!foundCiscoAnyConnectInstallation) {
        return <ErrorMessage message="Could not find any Cisco AnyConnect installation" />;
    }

    switch (command) {
        case undefined:
            return <Connecter requestedSetup={requestedSetup} onlyVpn={onlyVpn} />;
        case 'd':
        case 'disconnect':
            return <Disconnecter />;
        case 's':
        case 'status':
            return <ConnectionStatuses onlyVpn={onlyVpn} />;
        default:
            return (
                <ErrorMessage
                    message="Invalid input"
                    commandSuggestion="`cisco-vpn-rdp-connecter --help`"
                    commandSuggestionSuffix="to show valid input."
                />
            );
    }
};

module.exports = App;
