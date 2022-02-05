const importJsx = require('import-jsx');
const {useState} = require('react');
const React = require('react');

const SuccessMessage = importJsx('./SuccessMessage.js');
const TextAndInputBox = importJsx('./TextAndInputBox.js');

const STEPS = {
    VPN_SERVER: 0,
    GROUP: 1,
    USERNAME: 2,
    PASSWORD: 3,
    RDP_SERVER: 4
};

const SetupCredentials = ({onComplete, defaultCredentials}) => {
    const [vpnServer, setVpnServer] = useState('');
    const [group, setGroup] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(STEPS.VPN_SERVER);

    const goToNextStep = () => {
        setStep(step + 1);
    };

    const onServerSet = inputServer => {
        setVpnServer(inputServer);
        goToNextStep();
    };

    const onGroupSet = inputGroup => {
        setGroup(inputGroup);
        goToNextStep();
    };

    const onUsernameSet = inputUsername => {
        setUsername(inputUsername);
        goToNextStep();
    };

    const onPasswordSet = inputPassword => {
        setPassword(inputPassword);
        goToNextStep();
    };

    const onSetupCompleted = inputRdpServer => {
        goToNextStep();

        if (!onComplete) {
            return;
        }

        onComplete({
            vpn: {
                server: vpnServer,
                group,
                username,
                password
            },
            rdp: {
                server: inputRdpServer
            }
        });
    };

    // If all steps are compeleted show "completed" message
    if (step > STEPS.RDP_SERVER) {
        return <SuccessMessage message="Setup completed" />;
    }

    return (
        <>
            {step >= STEPS.VPN_SERVER && (
                <TextAndInputBox
                    text="VPN server"
                    defaultText={defaultCredentials.vpn.server}
                    onSubmit={onServerSet}
                />
            )}
            {step >= STEPS.GROUP && (
                <TextAndInputBox
                    text="Group"
                    defaultText={defaultCredentials.vpn.group}
                    onSubmit={onGroupSet}
                />
            )}
            {step >= STEPS.USERNAME && (
                <TextAndInputBox
                    text="Username"
                    defaultText={defaultCredentials.vpn.username}
                    onSubmit={onUsernameSet}
                />
            )}
            {step >= STEPS.PASSWORD && (
                <TextAndInputBox
                    text="Password"
                    onSubmit={onPasswordSet}
                    mask="*"
                />
            )}
            {step >= STEPS.RDP_SERVER && (
                <TextAndInputBox
                    text="RDP server"
                    defaultText={defaultCredentials.rdp.server}
                    onSubmit={onSetupCompleted}
                />
            )}
        </>
    );
};

module.exports = SetupCredentials;
