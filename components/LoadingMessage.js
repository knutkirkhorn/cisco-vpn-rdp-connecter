import React from 'react';
import {Text} from 'ink';
import logSymbols from 'log-symbols';
import isUnicodeSupported from 'is-unicode-supported';
import Spinner from 'ink-spinner';

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

export default LoadingMessage;
