import dotenv from 'dotenv';

// Load the stored variables from `.env` file into process.env
dotenv.config();

const defaultVpnGroup = 1;

export default {
    // Cisco VPN settings
    vpnServer: process.env.VPN_SERVER || '',
    vpnUsername: process.env.VPN_USERNAME || '',
    vpnPassword: process.env.VPN_PASSWORD || '',
    vpnGroup: process.env.VPN_GROUP || defaultVpnGroup,
    // Remote Desktop Protocol settings
    rdpServer: process.env.RDP_SERVER || ''
};
