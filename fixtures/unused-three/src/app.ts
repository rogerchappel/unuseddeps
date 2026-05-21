import express from 'express';
import _ from 'lodash';

const app = express();
app.get('/', (_req, res) => res.send(_.join(['Hello', 'World'], ' ')));
