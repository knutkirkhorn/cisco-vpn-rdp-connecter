const importJsx = require('import-jsx');
const {Text, Box, useStdin} = require('ink');
const {useState, useEffect} = require('react');
const React = require('react');
const SelectInput = require('ink-select-input').default;
const {getAllCiscoVpnGroups} = require('..');

const SuccessMessage = importJsx('./SuccessMessage.js');
const TextAndInputBox = importJsx('./TextAndInputBox.js');
const LoadingMessage = importJsx('./LoadingMessage.js');

const STEPS = {
    VPN_SERVER: 0,
    GROUP: 1,
    USERNAME: 2,
    PASSWORD: 3,
    RDP_SERVER: 4,
    ONLY_VPN: 5
};
const yesNoOptions = [
    {
        label: 'No',
        value: 'no'
    },
    {
        label: 'Yes',
        value: 'yes'
    }
];

const SetupCredentials = ({onComplete, defaultCredentials}) => {
    const [vpnServer, setVpnServer] = useState('');
    const [group, setGroup] = useState();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rdpServer, setRdpServer] = useState('');
    const [onlyVpn, setOnlyVpn] = useState();
    const [step, setStep] = useState(STEPS.VPN_SERVER);
    const [vpnGroups, setVpnGroups] = useState();
    const {setRawMode} = useStdin();
    const [isRetrievingVpnGroups, setIsRetrievingVpnGroups] = useState(false);

    useEffect(() => {
        if (onlyVpn === undefined) return;

        onComplete({
            vpn: {
                server: vpnServer,
                group: group.value,
                username,
                password
            },
            rdp: {
                server: rdpServer
            },
            onlyVpn
        });
    }, [onlyVpn]);

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

        // Show loader when fetching Cisco groups
        setIsRetrievingVpnGroups(true);

        const fetchedCiscoGroups = await getAllCiscoVpnGroups(inputServer);
        const ciscoGroups = fetchedCiscoGroups.map(vpnGroup => ({
            value: vpnGroup.number,
            label: vpnGroup.name
        }));
        setVpnGroups(ciscoGroups);
        setIsRetrievingVpnGroups(false);

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

    const onRdpServerSet = inputRdpServer => {
        setRdpServer(inputRdpServer);
        goToNextStep();
    };

    const handleOnlyVpnSet = inputOnlyVpn => {
        setOnlyVpn(inputOnlyVpn.value === 'yes');
        goToNextStep();
    };

    // If all steps are completed show "completed" message
    if (step > STEPS.ONLY_VPN) {
        return <SuccessMessage message="Setup completed" />;
    }

    return (
        <>
            {step >= STEPS.VPN_SERVER && (
                <>
                    <TextAndInputBox
                        text="VPN server"
                        defaultText={defaultCredentials.vpn.server}
                        onSubmit={onServerSet}
                    />
                    {
                        isRetrievingVpnGroups && (
                            <LoadingMessage isCompleted={false} loadingMessage="Retrieving VPN groups for given server" loadedMessage="" />
                        )
                    }
                </>
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
                    onSubmit={onRdpServerSet}
                />
            )}
            {step >= STEPS.ONLY_VPN && (
                <Box>
                    <Text>Only connect to VPN: </Text>
                    <SelectInput
                        items={yesNoOptions}
                        initialIndex={0}
                        onSelect={handleOnlyVpnSet}
                    />
                </Box>
            )}
        </>
    );
};

module.exports = SetupCredentials;
