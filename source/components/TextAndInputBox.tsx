/* eslint-disable react/require-default-props */
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import React, {useEffect, useState} from 'react';

type Properties = {
	text: string;
	onSubmit: (input: string) => void;
	mask?: string;
	defaultText?: string;
	newCompletionState?: boolean;
};

export default function TextAndInputBox({
	text,
	onSubmit,
	mask,
	defaultText = '',
	newCompletionState,
}: Properties) {
	const [inputText, setInputText] = useState('');
	const [isCompleted, setIsCompleted] = useState(false);
	const [submittedInput, setSubmittedInput] = useState('');

	const startInputText = `${text}:`;

	useEffect(() => {
		if (!newCompletionState) {
			setIsCompleted(false);
		}
	}, [newCompletionState]);

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
}
