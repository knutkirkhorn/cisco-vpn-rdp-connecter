const React = require('react');
const {Text, useApp} = require('ink');
const {useState, useEffect} = require('react');
const logSymbols = require('log-symbols');
const importJsx = require('import-jsx');
const {isCiscoVpnConnected} = require('..');
const {isRdpWindowOpened} = require('..');

const LoadingMessage = importJsx('./LoadingMessage.js');

const StatusMessage = ({okStatus, type, message}) => (
    <Text>{`${okStatus ? logSymbols.success : logSymbols.error} ${type}: ${message}`}</Text>
);

const ConnectionStatuses = ({onlyVpn}) => {
    const [isVpnConnected, setIsVpnConnected] = useState(false);
    const [isRdpOpened, setIsRdpOpened] = useState(false);
    const [hasCheckedStatuses, setHasCheckedStatuses] = useState(false);
    const {exit} = useApp();

    useEffect(() => {
        const checkStatuses = async () => {
            const vpnConnected = await isCiscoVpnConnected();
            setIsVpnConnected(vpnConnected);

            const rdpOpened = await isRdpWindowOpened();
            setIsRdpOpened(rdpOpened);

            setHasCheckedStatuses(true);
            exit();
        };
        checkStatuses();
    }, []);

    if (!hasCheckedStatuses) {
        return <LoadingMessage isCompleted={hasCheckedStatuses} loadingMessage="Checking statuses" />;
    }

    return (
        <>
            <StatusMessage okStatus={isVpnConnected} type="VPN" message={isVpnConnected ? 'connected' : 'disconnected'} />
            {onlyVpn ? (
                <Text>- RDP: skipped check</Text>
            ) : (
                <StatusMessage okStatus={isRdpOpened} type="RDP" message={isRdpOpened ? 'opened' : 'not opened'} />
            )}
        </>
    );
};

module.exports = ConnectionStatuses;
