const cors = require('cors');
const express = require('express');

const config = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/tasks.routes');
const noteRoutes = require('./routes/notes.routes');
const eventRoutes = require('./routes/events.routes');
const reminderRoutes = require('./routes/reminders.routes');
const notificationRoutes = require('./routes/notifications.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

app.use(errorHandler);

module.exports = app;
