const sql = require("mssql");
require("dotenv").config();

const env = (key, fallback) => {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const dbConfig = {
  server: env("DB_SERVER", "localhost"),
  database: env("DB_DATABASE", env("DB_NAME", "SecureStudentDB")),
  user: env("DB_USER", "WebAppUser"),
  password: env("DB_PASSWORD", "StrongPassword2026!"),
  port: parseInt(env("DB_PORT", "1433"), 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

const auditFilePath =
  process.env.SQL_AUDIT_FILEPATH || "C:\\SQL_Audits\\*.sqlaudit";

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to MSSQL");
  }
  return pool;
};

module.exports = { getPool, sql, auditFilePath };
