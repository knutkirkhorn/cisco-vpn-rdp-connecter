const React = require('react');
const {Text} = require('ink');
const logSymbols = require('log-symbols');
const isUnicodeSupported = require('is-unicode-supported');
const Spinner = require('ink-spinner').default;

const LoadingMessage = ({isCompleted, loadingMessage, loadedMessage}) => (
	<Text>
		{isCompleted ? (
			<>
				<Text color="green">
					{logSymbols.success}
				</Text>
				{` ${loadedMessage}`}
			</>
		) : (
			<>
				<Text color="blue">
					{isUnicodeSupported() ? <Spinner /> : <Spinner type="line" />}
				</Text>
				{` ${loadingMessage}`}
			</>
		)}
	</Text>
);

module.exports = LoadingMessage;
