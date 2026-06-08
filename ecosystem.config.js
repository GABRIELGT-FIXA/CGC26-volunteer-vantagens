// Configuração do PM2 — Volunteer Vantagens
// Uso: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'cgc26-backend',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'cgc26-frontend',
      cwd: './frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
