const API_KEY = process.env.API_KEY || 'dev-key-change-me';

export function requireApiKey(req, res, next) {
    const provided = req.header('x-api-key');
    if (!provided || provided !== API_KEY) {
        return res.status(401).json({
            error: 'unauthorized',
            message: 'missing or invalid X-API-Key header',
        });
    }
    next();
}   