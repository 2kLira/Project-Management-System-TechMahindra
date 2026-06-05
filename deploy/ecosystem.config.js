// pm2: dos backends aislados en la misma VM.
//  - prod  -> API 8080 + WS 8090  (rama main)
//  - dev   -> API 8081 + WS 8091  (rama dev / staging)
// Cada proceso corre con cwd en su carpeta, así dotenv carga SU propio
// .env (/srv/pms/<env>/api/.env) con sus credenciales de Supabase, JWT, etc.
// COOKIE_SECURE=true porque ambos se sirven por HTTPS detrás de Caddy.
module.exports = {
  apps: [
    {
      name: 'pms-api-prod',
      cwd: '/srv/pms/prod/api',
      script: 'index.js',
      env: { NODE_ENV: 'production', PORT: '8080', WS_PORT: '8090', COOKIE_SECURE: 'true' },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'pms-api-dev',
      cwd: '/srv/pms/dev/api',
      script: 'index.js',
      env: { NODE_ENV: 'production', PORT: '8081', WS_PORT: '8091', COOKIE_SECURE: 'true' },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
