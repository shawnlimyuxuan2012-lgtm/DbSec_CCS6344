const sql = require("mssql");
require("dotenv").config();

const env = (key, fallback) => {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const sharedOptions = {
  server: env("DB_SERVER", "localhost"),
  database: env("DB_NAME", "SecureStudentDB"),
  port: parseInt(env("DB_PORT", "1433"), 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const roleConfigs = {
  admin: {
    ...sharedOptions,
    user: env("DB_USER_ADMIN", "AppAdmin"),
    password: env("DB_PASS_ADMIN", "Admin@SecureDB2026!"),
  },
  lecturer: {
    ...sharedOptions,
    user: env("DB_USER_LECTURER", "AppLecturer"),
    password: env("DB_PASS_LECTURER", "Lecturer@SecureDB2026!"),
  },
  student: {
    ...sharedOptions,
    user: env("DB_USER_STUDENT", "AppStudent"),
    password: env("DB_PASS_STUDENT", "Student@SecureDB2026!"),
  },
};

const pools = {};
const initPools = async () => {
  for (const role of Object.keys(roleConfigs)) {
    pools[role] = await sql.connect(roleConfigs[role]);
    console.log(`✅ MSSQL pool ready for role: ${role}`);
  }
};

const getPool = (role = "student") => {
  const key = roleConfigs[role] ? role : "student";
  if (!pools[key]) throw new Error(`Pool for role '${key}' not ready`);
  return pools[key]; // sync, no await needed
};

const closeAllPools = async () => {
  for (const key of Object.keys(pools)) {
    try {
      await pools[key].close();
    } catch (_) {}
    delete pools[key];
  }
};

const auditFilePath =
  process.env.SQL_AUDIT_FILEPATH || "C:\\SQL_Audits\\*.sqlaudit";

module.exports = { getPool, initPools, closeAllPools, sql, auditFilePath };
