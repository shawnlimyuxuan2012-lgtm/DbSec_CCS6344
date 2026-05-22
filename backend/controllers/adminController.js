const { getPool, sql, auditFilePath } = require("../config/db");
const { logAction } = require("../middleware/auth");
const { hashPassword } = require("../utils/passwordHash");

const ensure = async () => {
  return await getPool("admin");
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().query(
      `SELECT id, name, email, role, pdpa_consent, is_deleted,
              delete_requested_at, created_at FROM users ORDER BY created_at DESC`,
    );
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// POST /api/admin/users
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }
  if (!["student", "lecturer", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const pool = await ensure();
    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM users WHERE email = @email");

    if (existing.recordset[0]) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await hashPassword(password);
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("password_hash", sql.NVarChar, hash)
      .input("role", sql.NVarChar, role)
      .query(`INSERT INTO users (name, email, password_hash, role, pdpa_consent)
              OUTPUT INSERTED.id VALUES (@name, @email, @password_hash, @role, 1)`);

    const id = result.recordset[0].id;
    await logAction(
      req.user.id,
      "ADMIN_CREATE_USER",
      "users",
      id,
      { email, role },
      req.ip,
      req.user.role,
    );
    res.status(201).json({ message: "User created", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  const { name, email, role, is_deleted } = req.body;

  try {
    const pool = await ensure();
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("role", sql.NVarChar, role)
      .input("is_deleted", sql.Bit, is_deleted ? 1 : 0)
      .input("id", sql.Int, req.params.id)
      .query(`UPDATE users SET name=@name, email=@email, role=@role,
              is_deleted=@is_deleted, updated_at=GETDATE() WHERE id=@id`);

    await logAction(
      req.user.id,
      "ADMIN_UPDATE_USER",
      "users",
      req.params.id,
      { name, role },
      req.ip,
      req.user.role,
    );
    res.json({ message: "User updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// DELETE /api/admin/users/:id (soft delete)
const deactivateUser = async (req, res) => {
  try {
    const pool = await ensure();
    await pool
      .request()
      .input("targetId", sql.Int, req.params.id)
      .execute("sp_SoftDeleteUser");

    await logAction(
      req.user.id,
      "ADMIN_DEACTIVATE_USER",
      "users",
      req.params.id,
      null,
      req.ip,
      req.user.role,
    );
    res.json({ message: "User deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
// DELETE /api/admin/users/:id/permanent (hard delete - permanent removal)
const deleteUser = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .execute("sp_HardDeleteUser");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAction(
      req.user.id,
      "ADMIN_DELETE_USER",
      "users",
      req.params.id,
      null,
      req.ip,
      req.user.role,
    );
    res.json({ message: "User permanently deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to permanently delete user" });
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  const { type, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const pool = await ensure();

    if (type === "sqlserver") {
      const result = await pool
        .request()
        .input("auditFile", sql.NVarChar, auditFilePath)
        .input(
          "database",
          sql.NVarChar,
          process.env.DB_DATABASE || "AssessmentPlatform",
        )
        .input("limit", sql.Int, parseInt(limit)).query(`
          SELECT TOP (@limit)
            event_time, action_id, succeeded, session_id,
            server_principal_name, database_principal_name, target_server_principal_name,
            object_name, database_name,
            statement, additional_information, server_instance_name, client_ip
          FROM sys.fn_get_audit_file(@auditFile, DEFAULT, DEFAULT)
          WHERE database_name = @database
          ORDER BY event_time DESC
        `);

      const logs = result.recordset.map((row, index) => ({
        id: `${row.session_id || "sql"}-${index}-${row.event_time ? new Date(row.event_time).getTime() : Date.now()}`,
        user_name:
          row.server_principal_name ||
          row.database_principal_name ||
          row.target_server_principal_name ||
          "N/A",
        user_email: null,
        action: row.action_id,
        entity:
          row.object_name ||
          row.object_schema_name ||
          row.database_name ||
          "SQL Audit",
        entity_id: null,
        ip_address: row.client_ip || row.server_instance_name || "N/A",
        created_at: row.event_time || new Date(),
        statement: row.statement || row.additional_information || "",
        database_name: row.database_name,
      }));

      return res.json(logs);
    }

    let query = `
      SELECT al.id, al.action, al.entity, al.entity_id, al.details,
             al.ip_address, al.created_at, u.name AS user_name, u.email AS user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    if (type === "grade") {
      query = `
        SELECT gal.id, gal.action, gal.ip_address, gal.accessed_at AS created_at,
               u.name AS user_name, u.email AS user_email,
               g.score, g.submission_id
        FROM grade_access_logs gal
        LEFT JOIN users u ON gal.user_id = u.id
        LEFT JOIN grades g ON gal.grade_id = g.id
      `;
    }
    query += ` ORDER BY created_at DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

// DELETE /api/admin/purge-records
const purgeRecords = async (req, res) => {
  const { days = 365 } = req.body;

  try {
    const pool = await ensure();
    const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Hard delete old audit logs
    const logsRes = await pool
      .request()
      .input("cutoff", sql.DateTime, cutoff)
      .query("DELETE FROM audit_logs WHERE created_at < @cutoff");

    // Hard delete soft-deleted users who requested deletion > 30 days ago
    const usersRes = await pool
      .request()
      .input(
        "cutoff30",
        sql.DateTime,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      )
      .query(
        "DELETE FROM users WHERE is_deleted=1 AND delete_requested_at < @cutoff30",
      );

    await logAction(
      req.user.id,
      "PURGE_RECORDS",
      "system",
      null,
      {
        days,
        logsDeleted: logsRes.rowsAffected[0],
        usersDeleted: usersRes.rowsAffected[0],
      },
      req.ip,
      req.user.role,
    );

    res.json({
      message: "Purge complete",
      logsDeleted: logsRes.rowsAffected[0],
      usersDeleted: usersRes.rowsAffected[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to purge records" });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  getAuditLogs,
  purgeRecords,
};
