const http = require('http');

const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/db');
const { startReminderWorker } = require('./jobs/reminderWorker');
const { initSockets } = require('./sockets');

async function start() {
  await connectDatabase();

  const server = http.createServer(app);
  initSockets(server);
  startReminderWorker();

  server.listen(config.port, () => {
    console.log(`API listening on :${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
