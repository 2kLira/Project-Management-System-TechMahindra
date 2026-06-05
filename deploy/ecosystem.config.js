// pm2: dos backends aislados en la misma VM.
//  - prod  -> puerto 8080  (rama main)
//  - dev   -> puerto 8081  (rama dev / staging)
// Cada proceso corre con cwd en su carpeta, así dotenv carga SU propio
// .env (/srv/pms/<env>/api/.env) con sus credenciales de Supabase, JWT, etc.
// COOKIE_SECURE=true porque ambos se sirven por HTTPS detrás de Caddy.
module.exports = {
  apps: [
    {
      name: 'pms-api-prod',
      cwd: '/srv/pms/prod/api',
      script: 'index.js',
      env: { NODE_ENV: 'production', PORT: '8080', COOKIE_SECURE: 'true' },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'pms-api-dev',
      cwd: '/srv/pms/dev/api',
      script: 'index.js',
      env: { NODE_ENV: 'production', PORT: '8081', COOKIE_SECURE: 'true' },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
