const React = require('react');
const importJsx = require('import-jsx');
const {useEffect} = require('react');

const Connecter = importJsx('./components/Connecter.js');
const Disconnecter = importJsx('./components/Disconnecter.js');
const ConnectionStatuses = importJsx('./components/ConnectionStatuses.js');
const ErrorMessage = importJsx('./components/ErrorMessage.js');

const App = ({command, setup: requestedSetup, onlyVpn}) => {
    useEffect(() => () => {
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
    }, []);

    switch (command) {
        case undefined:
            return <Connecter requestedSetup={requestedSetup} onlyVpn={onlyVpn} />;
        case 'd':
        case 'disconnect':
            return <Disconnecter />;
        case 'status':
            return <ConnectionStatuses />;
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
