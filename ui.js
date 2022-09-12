const React = require('react');
const importJsx = require('import-jsx');
const {useEffect} = require('react');

const Connecter = importJsx('./components/Connecter.js');
const Disconnecter = importJsx('./components/Disconnecter.js');
const ConnectionStatuses = importJsx('./components/ConnectionStatuses.js');

const App = ({setup: requestedSetup, disconnect, showConnectionStatuses}) => {
    useEffect(() => () => {
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
    }, []);

    if (disconnect) {
        return <Disconnecter />;
    }

    if (showConnectionStatuses) {
        return <ConnectionStatuses />;
    }

    return <Connecter requestedSetup={requestedSetup} />;
};

module.exports = App;
