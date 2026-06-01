// api/proxy.js
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { endpoint } = req.query;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint is required' });
    }

    try {
        const token = process.env.FOOTBALL_API_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'FOOTBALL_API_TOKEN environment variable is not configured' });
        }

        const apiBase = 'https://api.football-data.org/v4';
        
        // Build the target URL
        const targetUrl = new URL(`${apiBase}${endpoint}`);
        
        // Forward all query parameters (except 'endpoint' itself)
        for (const [key, value] of Object.entries(req.query)) {
            if (key !== 'endpoint') {
                targetUrl.searchParams.set(key, value);
            }
        }

        const response = await fetch(targetUrl.toString(), {
            headers: {
                'X-Auth-Token': token
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Failed to fetch from API', details: error.message });
    }
};
