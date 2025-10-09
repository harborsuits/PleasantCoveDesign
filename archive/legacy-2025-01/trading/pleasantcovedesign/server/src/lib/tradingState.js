let paused = String(process.env.TRADING_PAUSED || '').toLowerCase() === 'true';

module.exports.tradingState = {
  isPaused: () => paused,
  pause: () => { paused = true; },
  resume: () => { paused = false; },
};


