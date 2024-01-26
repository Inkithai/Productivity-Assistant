const cors = require('cors');
const express = require('express');

const config = require('./config/env');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});

module.exports = app;
