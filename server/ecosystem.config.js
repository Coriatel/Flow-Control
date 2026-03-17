module.exports = {
  apps: [
    {
      name: "flow-api",
      script: "dist/src/server.js",
      cwd: "/opt/flow-control/app/server",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
