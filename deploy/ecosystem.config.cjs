// PM2 process list for the server (used by deploy/remote-deploy.sh).
// Paths go through /opt/khilona/current, which always points at the live release.
const base = '/opt/khilona/current';
const logs = '/opt/khilona/shared/logs';

const common = {
  env: { NODE_ENV: 'production' },
  time: true,
  max_restarts: 20,
  restart_delay: 3000,
  kill_timeout: 8000,
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'khilona-api',
      cwd: `${base}/khilona_backend`,
      script: 'dist/main.js',
      max_memory_restart: '700M',
      out_file: `${logs}/api.out.log`,
      error_file: `${logs}/api.err.log`,
    },
    {
      ...common,
      name: 'khilona-store',
      cwd: `${base}/khilona_userpanel`,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      max_memory_restart: '700M',
      out_file: `${logs}/store.out.log`,
      error_file: `${logs}/store.err.log`,
    },
    {
      ...common,
      name: 'khilona-admin',
      cwd: `${base}/khilona_adminpanel`,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001 -H 127.0.0.1',
      max_memory_restart: '500M',
      out_file: `${logs}/admin.out.log`,
      error_file: `${logs}/admin.err.log`,
    },
  ],
};
