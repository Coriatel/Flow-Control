module.exports = {
  apps: [{
    name: 'flowcontrol-api',
    script: 'dist/server.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    exp_backoff_restart_delay: 100,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
