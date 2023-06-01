export type Config = {
	vpn: {
		server: string;
		group: string;
		username: string;
		password: string;
	};
	rdp: {
		server: string;
	};
	onlyVpn: boolean;
};

export const schema = {
	vpn: {
		type: 'object',
		properties: {
			server: {
				type: 'string'
			},
			group: {
				type: 'string'
			},
			username: {
				type: 'string'
			},
			password: {
				type: 'string'
			}
		}
	},
	rdp: {
		type: 'object',
		properties: {
			server: {
				type: 'string'
			}
		}
	},
	onlyVpn: {
		type: 'boolean'
	}
};
