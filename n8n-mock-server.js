const http = require('http');

// Simple simulator for n8n webhooks to log payloads from Supabase Edge Functions in local dev
const server = http.createServer((req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        console.log(`\n[n8n Simulator] Received POST at ${req.url}`);
        if (body) {
            try {
                const json = JSON.parse(body);
                console.dir(json, { depth: null, colors: true });

                if (req.url.includes('/otp-send')) {
                    console.log(`\n🟢 ACTING AS N8N: Sending WhatsApp to ${json.phone} with code: ${json.code}`);
                } else if (req.url.includes('/booking-confirmed')) {
                    console.log(`\n🟢 ACTING AS N8N: Sending Confirmation WhatsApp for appointment ${json.booking.id} to ${json.customer.first_name}`);
                }

            } catch (e) {
                console.log("Raw body:", body);
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Webhook received by Simulator" }));
    });
});

const PORT = 5678; // Default n8n webhook port
server.listen(PORT, () => {
    console.log(`n8n Webhook Simulator running on http://localhost:${PORT}`);
    console.log(`Set N8N_WEBHOOK_URL="http://localhost:${PORT}" in your .env for Supabase Edge Functions.`);
});
