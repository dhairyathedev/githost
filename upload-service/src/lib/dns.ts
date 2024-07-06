import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const createDNSRecord = async (subdomain: string): Promise<void> => {
    console.log(process.env.CLOUDFLARE_ZONE_ID)
    const dnsRecord = {
        type: 'A',  // Type of DNS record (A, CNAME, etc.)
        name: `${subdomain}.githost.xyz`,  // The name of the DNS record
        content: process.env.IP_ADDRESS,  // The value of the DNS record
        ttl: 120,  // Time to live
        proxied: false  // Whether the record is proxied through Cloudflare
    };
    
    const url = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`;
    
    const headers = {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json'
    };
    
    axios.post(url, dnsRecord, { headers })
        .then(response => {
            if (response.status === 200) {
                console.log('DNS record created successfully.');
            } else {
                console.log('Failed to create DNS record.');
                console.log(response.data);
            }
        })
        .catch(error => {
            console.error('Error creating DNS record:', error);
        });
}