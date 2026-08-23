// PM2 configuration for running the agent as a managed service.
module.exports = {
  apps: [
    {
      name: 'hotspot-agent',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
