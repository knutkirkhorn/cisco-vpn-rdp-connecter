/* eslint-disable react/require-default-props */
import React from 'react';
import {Text} from 'ink';
import logSymbols from 'log-symbols';
import isUnicodeSupported from 'is-unicode-supported';
import Spinner from 'ink-spinner';

type Properties = {
	isCompleted?: boolean;
	loadingMessage: string;
	loadedMessage?: string;
};

export default function LoadingMessage({isCompleted = false, loadingMessage, loadedMessage}: Properties) {
	return (
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
}
