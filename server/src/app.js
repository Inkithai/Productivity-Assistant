const cors = require('cors');
const express = require('express');

const config = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/tasks.routes');
const noteRoutes = require('./routes/notes.routes');
const eventRoutes = require('./routes/events.routes');
const reminderRoutes = require('./routes/reminders.routes');
const notificationRoutes = require('./routes/notifications.routes');
const userRoutes = require('./routes/users.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const assistantRoutes = require('./routes/assistant.routes');
const searchRoutes = require('./routes/search.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { createAuthLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// brute-force protection; skipped in tests so suites can register freely
if (config.env !== 'test') {
  app.use('/api/auth', createAuthLimiter());
}

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/search', searchRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

app.use(errorHandler);

module.exports = app;
