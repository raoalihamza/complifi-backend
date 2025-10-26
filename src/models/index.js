const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../config/database.js")[env];
const db = {};

let sequelize;

// Initialize Sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Load all model files dynamically
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    try {
      const modelDefiner = require(path.join(__dirname, file));

      // Skip if the required file doesn't export a function (e.g., placeholder files)
      if (typeof modelDefiner !== "function") {
        console.log(`⏭️  Skipping ${file}: model not yet implemented`);
        return;
      }

      const model = modelDefiner(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      console.log(`✅ Loaded model: ${model.name}`);
    } catch (error) {
      console.error(`❌ Error loading model ${file}:`, error.message);
    }
  });

// Set up model associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
