
require("dotenv").config();

const app = require("./app");
const { pool } = require("./db");

const port = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Connesso a PostgreSQL");

    app.listen(port, () => {
      console.log(`PlanMy API in ascolto su http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Impossibile avviare il server:", error.message);
    process.exit(1);
  }
}

start();
