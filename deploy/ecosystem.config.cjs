/** PM2: Next.js dev server for a shared development host. */
module.exports = {
  apps: [
    {
      name: 'webapp-frontend-dev',
      cwd: __dirname + '/..',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'development' },
    },
  ],
};
