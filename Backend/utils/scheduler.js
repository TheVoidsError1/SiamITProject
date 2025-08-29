const axios = require('axios');
const cron = require('node-cron');

/**
 * Register all scheduled jobs for the backend application.
 * - Yearly reset of leave usage on Jan 1st 00:05 Asia/Bangkok
 *   Calls POST /api/leave-quota/reset with { force: false, strategy: 'zero' }
 *   and only affects positions with new_year_quota = 0.
 *
 * @param {object} config - Application configuration from ./config
 */
function registerScheduledJobs(config) {
  try {
    const isCronEnabled = (process.env.ENABLE_YEARLY_RESET_CRON || 'true').toLowerCase() !== 'false';
    const cronTimezone = process.env.CRON_TZ || 'Asia/Bangkok';
    if (!isCronEnabled) {
      console.log('[CRON] Yearly reset job is disabled via ENABLE_YEARLY_RESET_CRON=false');
      return;
    }

    // Run at 00:05 on January 1st every year
    cron.schedule('5 0 1 1 *', async () => {
      try {
        const resetUrl = `${config.server.apiBaseUrl}/api/leave-quota-reset/reset`;
        const response = await axios.post(resetUrl, { force: false, strategy: 'zero' }, { timeout: 60000 });
        console.log('[CRON] Yearly leave reset executed:', response.data);
      } catch (err) {
        console.error('[CRON] Yearly leave reset failed:', err?.message || err);
      }
    }, { timezone: cronTimezone });

    console.log(`[CRON] Yearly reset job scheduled at 00:05 1 Jan (${cronTimezone}). Set ENABLE_YEARLY_RESET_CRON=false to disable.`);
  } catch (err) {
    console.error('[CRON] Failed to schedule yearly reset job:', err?.message || err);
  }
}

module.exports = { registerScheduledJobs };


