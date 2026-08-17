/** PM2 — Next.js production. Listen 127.0.0.1:8093; Nginx proxy_pass ke port ini. */
module.exports = {
  apps: [
    {
      name: 'his-standard-uiux',
      cwd: __dirname + '/..',
      script: 'node_modules/.bin/next',
      args: 'start -H 127.0.0.1 -p 8093',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: 8093,
      },
    },
  ],
};
