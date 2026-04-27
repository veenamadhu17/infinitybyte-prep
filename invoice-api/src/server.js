import express from 'express';
import db from './db.js';

const app = express();

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

app.listen(3000, () => {
    console.log('Server running on port 3000')
})