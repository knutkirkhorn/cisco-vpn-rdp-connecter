const React = require('react');
const importJsx = require('import-jsx');

const Connecter = importJsx('./components/Connecter.js');
const Disconnecter = importJsx('./components/Disconnecter.js');

const App = ({setup: requestedSetup, disconnect}) => {
    if (disconnect) {
        return <Disconnecter />;
    }

    return <Connecter requestedSetup={requestedSetup} />;
};

module.exports = App;
