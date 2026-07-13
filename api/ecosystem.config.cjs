module.exports = {
  apps: [
    {
      name: "index",
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
      name: "express",
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
      name: "worker-enrolment",
      script: "bun",
      args: "run worker-enrolment.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-enrolment-out.log",
      error_file: "./logs/prod/worker-enrolment-error.log",
    },

    {
      name: "worker-notification",
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
      name: "worker-payment-success",
      script: "bun",
      args: "run worker-payment-success.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-payment-success-out.log",
      error_file: "./logs/prod/worker-payment-success-error.log",
    },

    {
      name: "worker-payment-failed",
      script: "bun",
      args: "run worker-payment-failed.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-payment-failed-out.log",
      error_file: "./logs/prod/worker-payment-failed-error.log",
    },

    {
      name: "worker-event",
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

    {
      name: "worker-wallet",
      script: "bun",
      args: "run worker-wallet.ts",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/prod/worker-wallet-out.log",
      error_file: "./logs/prod/worker-wallet-error.log",
    }
  ],
};
