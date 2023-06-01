declare module 'cisco-vpn' {
	type Options = {
		exe?: string;
		server: string;
		username: string;
		password: string;
	};

	type CiscoVPN = {
		connect: () => Promise<void>;
		disconnect: () => Promise<void>;
	};

	export default function ciscoVpn(options: Options): CiscoVPN;
}
