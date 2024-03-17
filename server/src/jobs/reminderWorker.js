const { dispatchDueReminders } = require('../services/reminderDispatcher.service');

const TICK_INTERVAL_MS = 30 * 1000;

let timer = null;

function startReminderWorker() {
  if (timer) {
    return;
  }

  async function tick() {
    try {
      const dispatched = await dispatchDueReminders();
      if (dispatched.length > 0) {
        console.log(`[reminders] dispatched ${dispatched.length} reminder(s)`);
      }
    } catch (err) {
      console.error('[reminders] dispatch failed:', err.message);
    }
  }

  timer = setInterval(tick, TICK_INTERVAL_MS);
  tick();
}

function stopReminderWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startReminderWorker, stopReminderWorker, TICK_INTERVAL_MS };
