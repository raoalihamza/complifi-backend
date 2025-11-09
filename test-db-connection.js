const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});

async function testConnection() {
  try {
    console.log("Testing Supabase connection...\n");
    const bcrypt = require("bcryptjs");
    const hash = bcrypt.hashSync("SecurePassword123!", 10);
    console.log("haashed password", hash);

    await sequelize.authenticate();
    console.log("✅ Supabase Database connected successfully!");

    // Test a simple query
    const result = await sequelize.query("SELECT NOW() as current_time");
    console.log("✅ Query test successful!");
    console.log("📅 Current database time:", result[0][0].current_time);

    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error("Error:", error.message);
    console.error("\nCheck:");
    console.error("1. DATABASE_URL is correct in .env");
    console.error("2. Password is correct");
    console.error("3. Database is accessible (not paused)");
    process.exit(1);
  }
}

testConnection();
