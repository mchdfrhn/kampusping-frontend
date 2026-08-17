/** PM2 — Next.js development/staging on server. */
module.exports = {
  apps: [
    {
      name: 'his-standard-uiux-dev',
      cwd: __dirname + '/..',
      script: 'node_modules/.bin/next',
      args: 'start -H 127.0.0.1 -p 8090',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: 8090,
      },
    },
  ],
};
