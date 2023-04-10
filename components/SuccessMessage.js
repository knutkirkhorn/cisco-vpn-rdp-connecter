import React from 'react';
import {Text} from 'ink';
import logSymbols from 'log-symbols';

const SuccessMessage = ({message}) => (
	<Text>{`${logSymbols.success} ${message}`}</Text>
);

export default SuccessMessage;
