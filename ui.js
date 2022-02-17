const React = require('react');
const importJsx = require('import-jsx');

const Connecter = importJsx('./components/Connecter.js');
const Disconnecter = importJsx('./components/Disconnecter.js');
const ConnectionStatuses = importJsx('./components/ConnectionStatuses.js');

const App = ({setup: requestedSetup, disconnect, showConnectionStatuses}) => {
    if (disconnect) {
        return <Disconnecter />;
    }

    if (showConnectionStatuses) {
        return <ConnectionStatuses />;
    }

    return <Connecter requestedSetup={requestedSetup} />;
};

module.exports = App;
