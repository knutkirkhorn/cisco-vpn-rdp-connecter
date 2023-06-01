import React from 'react';
import {Text} from 'ink';
import logSymbols from 'log-symbols';

type Properties = {
	message: string;
};

export default function SuccessMessage({message}: Properties) {
	return (
		<Text>{`${logSymbols.success} ${message}`}</Text>
	);
}
