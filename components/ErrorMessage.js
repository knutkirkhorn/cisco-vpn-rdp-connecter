const React = require('react');
const {Text, Box} = require('ink');
const logSymbols = require('log-symbols');

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

module.exports = ErrorMessage;
