const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/db');

async function start() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`API listening on :${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
