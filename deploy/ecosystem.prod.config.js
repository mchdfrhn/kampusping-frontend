/** PM2: Next.js in production. Listens on 127.0.0.1:8094 only; Nginx proxies to it. */
module.exports = {
  apps: [
    {
      name: 'webapp-frontend',
      cwd: __dirname + '/..',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 8094 -H 127.0.0.1',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' },
    },
  ],
};
