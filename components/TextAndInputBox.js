import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import React, {useState} from 'react';

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

		const unmaskedInput = inputText === '' ? defaultText : inputText;
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
			{isCompleted ? (
				<Text>{submittedInput}</Text>
			) : (
				<TextInput
					placeholder={mask ? mask.repeat(defaultText.length) : defaultText}
					value={inputText}
					onChange={setInputText}
					onSubmit={onCompleteInput}
					mask={mask}
				/>
			)}
		</Box>
	);
};

export default TextAndInputBox;
