const {Box, Text} = require('ink');
const TextInput = require('ink-text-input').default;
const {useState} = require('react');
const React = require('react');

const TextAndInputBox = ({
	text,
	onSubmit,
	mask,
	defaultText
}) => {
	const [inputText, setInputText] = useState('');
	const [isCompleted, setIsCompleted] = useState(false);
	const [submittedInput, setSubmittedInput] = useState('');

	const startInputText = `${text}:`;

	const onCompleteInput = () => {
		// Don't continue if there is no input
		if ((!inputText && !defaultText) || (inputText.trim() === '' && defaultText.trim() === '')) {
			return;
		}

		const unmaskedInput = inputText !== '' ? inputText : defaultText;
		let visualInput = unmaskedInput;

		// If the input uses a mask replace the text with mask in UI
		if (mask) {
			visualInput = mask.repeat(visualInput.length);
		}

		setSubmittedInput(visualInput);
		setIsCompleted(true);
		onSubmit(unmaskedInput);
	};

	return (
		<Box>
			<Box marginRight={1}>
				<Text>{startInputText}</Text>
			</Box>
			{!isCompleted ? (
				<TextInput
					placeholder={mask ? mask.repeat(defaultText.length) : defaultText}
					value={inputText}
					onChange={setInputText}
					onSubmit={onCompleteInput}
					mask={mask}
				/>
			) : (
				<Text>{submittedInput}</Text>
			)}
		</Box>
	);
};

module.exports = TextAndInputBox;
