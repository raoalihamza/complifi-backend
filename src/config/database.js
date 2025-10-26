require("dotenv").config();

// module.exports = {
//   development: {
//     username: process.env.DB_USER || "postgres",
//     password: process.env.DB_PASSWORD || "",
//     database: process.env.DB_NAME || "complifi_dev",
//     host: process.env.DB_HOST || "localhost",
//     port: process.env.DB_PORT || 5432,
//     dialect: "postgres",
//     logging: console.log,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//     define: {
//       timestamps: true,
//       underscored: true,
//       freezeTableName: true,
//     },
//   },

//   test: {
//     username: process.env.DB_USER || "postgres",
//     password: process.env.DB_PASSWORD || "",
//     database: (process.env.DB_NAME || "complifi") + "_test",
//     host: process.env.DB_HOST || "localhost",
//     port: process.env.DB_PORT || 5432,
//     dialect: "postgres",
//     logging: false,
//   },

//   production: {
//     use_env_variable: "DATABASE_URL",
//     dialect: "postgres",
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false,
//       },
//     },
//     logging: false,
//     pool: {
//       max: 10,
//       min: 2,
//       acquire: 30000,
//       idle: 10000,
//     },
//   },
// };

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },

  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  },

  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
};
