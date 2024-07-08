import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
    Permissions needed:
    - Account.Workers:Edit
    - Zone:Read
 */
export const createDNSRecord = async (subdomain: string): Promise<void> => {
    const data = {
        environment: "production",
        hostname: `${subdomain}.githost.xyz`,
        service: process.env.CLOUDFLARE_WORKER_NAME,
        zone_id: process.env.CLOUDFLARE_ZONE_ID
    };
    console.log('Creating DNS record:', data);
    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/workers/domains`;

    const headers = {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.put(url, data, { headers });
        if (response.status === 200) {
            console.log('DNS record created successfully.');
        } else {
            console.log('Failed to create DNS record.');
            console.log(response.data);
        }
    } catch (error: any) {
        if (error.response) {
            console.error('Error creating DNS record:', error.response.data);
        } else {
            console.error('Error creating DNS record:', error.message);
        }
    }
}
