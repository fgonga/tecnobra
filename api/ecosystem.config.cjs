module.exports = {
  apps: [
    {
      name: "tecnobra-api",
      script: "bun",
      args: "run index.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/index-out.log",
      error_file: "./logs/prod/index-error.log",
    },

    {
      name: "tecnobra-bull",
      script: "bun",
      args: "run express.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/express-out.log",
      error_file: "./logs/prod/express-error.log",
    },

    {
      name: "tecnobra-worker-notification",
      script: "bun",
      args: "run worker-notification.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-notification-out.log",
      error_file: "./logs/prod/worker-notification-error.log",
    },

    {
      name: "tecnobra-worker-event",
      script: "bun",
      args: "run worker-event.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-event-out.log",
      error_file: "./logs/prod/worker-event-error.log",
    },
  ],
};
