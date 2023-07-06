import {
	Text,
	Box,
	useStdin,
	useInput,
} from 'ink';
import React, {useState, useEffect} from 'react';
import SelectInput from 'ink-select-input';
import {getAllCiscoVpnGroups} from '../index.js';
import SuccessMessage from './SuccessMessage.js';
import TextAndInputBox from './TextAndInputBox.js';
import LoadingMessage from './LoadingMessage.js';
import {Config} from '../config.js';

const STEPS = {
	VPN_SERVER: 0,
	GROUP: 1,
	USERNAME: 2,
	PASSWORD: 3,
	RDP_SERVER: 4,
	ONLY_VPN: 5,
};
const yesNoOptions = [
	{
		label: 'No',
		value: 'no',
	},
	{
		label: 'Yes',
		value: 'yes',
	},
];

type Properties = {
	onComplete: (setupConfig: Config) => void;
	// eslint-disable-next-line react/require-default-props
	defaultCredentials?: Config;
};

type SelectInputItem = {
	label: string;
	value: string;
};

export default function SetupCredentials({onComplete, defaultCredentials}: Properties) {
	const [vpnServer, setVpnServer] = useState('');
	const [group, setGroup] = useState<SelectInputItem>({label: '', value: ''});
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [rdpServer, setRdpServer] = useState('');
	const [onlyVpn, setOnlyVpn] = useState<boolean>();
	const [step, setStep] = useState(STEPS.VPN_SERVER);
	const [vpnGroups, setVpnGroups] = useState<SelectInputItem[]>([]);
	const {setRawMode} = useStdin();
	const [isRetrievingVpnGroups, setIsRetrievingVpnGroups] = useState(false);

	useEffect(() => {
		if (onlyVpn === undefined) return;

		onComplete({
			vpn: {
				server: vpnServer,
				group: group.value,
				groupName: group.label,
				username,
				password,
			},
			rdp: {
				server: rdpServer,
			},
			onlyVpn,
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

	const goToPreviousStep = () => {
		setStep(step - 1);
	};

	useInput((_input, key) => {
		if (key.backspace && step >= STEPS.GROUP) {
			goToPreviousStep();
		}
	});

	const onServerSet = async (inputServer: string) => {
		setVpnServer(inputServer);

		// Show loader when fetching Cisco groups
		setIsRetrievingVpnGroups(true);

		const fetchedCiscoGroups = await getAllCiscoVpnGroups(inputServer);
		const ciscoGroups = fetchedCiscoGroups.map(vpnGroup => ({
			value: vpnGroup.number,
			label: vpnGroup.name,
		}));
		setVpnGroups(ciscoGroups);
		setIsRetrievingVpnGroups(false);

		goToNextStep();
	};

	const handleGroupSet = (inputGroup: SelectInputItem) => {
		setGroup(inputGroup);
		goToNextStep();
	};

	const onUsernameSet = (inputUsername: string) => {
		setUsername(inputUsername);
		goToNextStep();
	};

	const onPasswordSet = (inputPassword: string) => {
		setPassword(inputPassword);
		goToNextStep();
	};

	const onRdpServerSet = (inputRdpServer: string) => {
		setRdpServer(inputRdpServer);
		goToNextStep();
	};

	const handleOnlyVpnSet = (inputOnlyVpn: SelectInputItem) => {
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
						defaultText={defaultCredentials?.vpn.server}
						onSubmit={onServerSet}
						newCompletionState={step >= STEPS.GROUP}
					/>
					{isRetrievingVpnGroups && (
						<LoadingMessage
							isCompleted={false}
							loadingMessage="Retrieving VPN groups for given server"
							loadedMessage=""
						/>
					)}
				</>
			)}
			{step >= STEPS.GROUP && (
				step === STEPS.GROUP ? (
					<Box>
						<Text>Group: </Text>
						<SelectInput
							items={vpnGroups}
							initialIndex={Math.min(Number(defaultCredentials?.vpn.group), vpnGroups.length - 1)}
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
					defaultText={defaultCredentials?.vpn.username}
					onSubmit={onUsernameSet}
					newCompletionState={step >= STEPS.PASSWORD}
				/>
			)}
			{step >= STEPS.PASSWORD && (
				<TextAndInputBox
					text="Password"
					defaultText={defaultCredentials?.vpn.password}
					onSubmit={onPasswordSet}
					mask="*"
					newCompletionState={step >= STEPS.RDP_SERVER}
				/>
			)}
			{step >= STEPS.RDP_SERVER && (
				<TextAndInputBox
					text="RDP server"
					defaultText={defaultCredentials?.rdp.server}
					onSubmit={onRdpServerSet}
					newCompletionState={step >= STEPS.ONLY_VPN}
				/>
			)}
			{step >= STEPS.ONLY_VPN && (
				<Box>
					<Text>Only connect to VPN: </Text>
					<SelectInput
						items={yesNoOptions}
						initialIndex={defaultCredentials?.onlyVpn === true ? 1 : 0}
						onSelect={handleOnlyVpnSet}
					/>
				</Box>
			)}
		</>
	);
}
