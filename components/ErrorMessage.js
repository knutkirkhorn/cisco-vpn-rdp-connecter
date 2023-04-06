import React from 'react';
import {Text, Box} from 'ink';
import logSymbols from 'log-symbols';

const ErrorMessage = ({message, commandSuggestion, commandSuggestionSuffix}) => (
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

export default ErrorMessage;
