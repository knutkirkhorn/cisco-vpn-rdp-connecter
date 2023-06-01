/* eslint-disable react/require-default-props */
import React from 'react';
import {Text, Box} from 'ink';
import logSymbols from 'log-symbols';

type Properties = {
	message: string;
	commandSuggestion?: string;
	commandSuggestionSuffix?: string;
};

export default function ErrorMessage({message, commandSuggestion, commandSuggestionSuffix}: Properties) {
	return (
		<Box flexDirection="column">
			<Text color="redBright" bold>
				{`${logSymbols.error} ${message}`}
			</Text>
			{commandSuggestion && commandSuggestionSuffix && (
				<Text>
					Use
					{' '}
					<Text dimColor>{commandSuggestion}</Text>
					{' '}
					{commandSuggestionSuffix}
				</Text>
			)}
		</Box>
	);
}
