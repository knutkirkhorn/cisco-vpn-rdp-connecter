const importJsx = require('import-jsx');
const {Text, Box, useStdin} = require('ink');
const {useState} = require('react');
const React = require('react');
const SelectInput = require('ink-select-input').default;
const {getAllCiscoVpnGroups} = require('..');

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
    const [vpnGroups, setVpnGroups] = useState();
    const {setRawMode} = useStdin();

    const goToNextStep = () => {
        setStep(step + 1);

        /*
        TODO: without this it moves the input down a line after the `SelectInput` field.
        It also requires another `enter` keypress to continue.
        Remove this when fixed.
        */
        setRawMode(true);
    };

    const onServerSet = async inputServer => {
        setVpnServer(inputServer);

        const fetchedCiscoGroups = await getAllCiscoVpnGroups(inputServer);
        const ciscoGroups = fetchedCiscoGroups.map(vpnGroup => ({
            value: vpnGroup.number,
            label: vpnGroup.name
        }));
        setVpnGroups(ciscoGroups);

        goToNextStep();
    };

    const handleGroupSet = inputGroup => {
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
                group: group.value,
                username,
                password
            },
            rdp: {
                server: inputRdpServer
            }
        });
    };

    // If all steps are completed show "completed" message
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
                step === STEPS.GROUP ? (
                    <Box>
                        <Text>Group: </Text>
                        <SelectInput
                            items={vpnGroups}
                            initialIndex={Math.min(Number(defaultCredentials.vpn.group), vpnGroups.length - 1)}
                            onSelect={handleGroupSet}
                        />
                    </Box>
                ) : (
                    <Text>{`Group: ${group.label}`}</Text>
                )
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
