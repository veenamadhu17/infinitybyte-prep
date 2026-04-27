import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { requireApiKey } from './auth.js';
import invoicesRouter from './invoices.js';
import paymentsRouter from './payments.js';

const app = express();
app.use(express.json())

// check if stack is wired
app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

// OpenAPI docs
const openapiSpec = YAML.load('./openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// endpoints requiring a key
app.use('/invoices', requireApiKey, invoicesRouter);
app.use('/payments', requireApiKey, paymentsRouter);

// Last resort error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error', message: err.message });
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Invoice API listening on http://localhost:${PORT}`)
    console.log(`Swagger docs: http://localhost:${PORT}/docs`)
    console.log(`API key: ${process.env.API_KEY || 'dev-key-change-me'}`)
})