'use strict';

const { startServer } = require('./server/src/index.js');

void startServer().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unable to start the unified server.');
  process.exitCode = 1;
});
