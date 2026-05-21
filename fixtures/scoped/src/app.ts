import express from 'express';

const app: express.Express = express();
app.get('/', (_req, res) => res.send('ok'));
