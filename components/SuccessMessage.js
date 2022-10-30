const React = require('react');
const {Text} = require('ink');
const logSymbols = require('log-symbols');

const SuccessMessage = ({message}) => (
	<Text>{`${logSymbols.success} ${message}`}</Text>
);

module.exports = SuccessMessage;
