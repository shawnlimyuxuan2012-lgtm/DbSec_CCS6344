const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT id, name, email, role, is_deleted FROM users WHERE id = @id');

    const user = result.recordset[0];
    if (!user || user.is_deleted) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control factory
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  }
  next();
};

// Audit logger helper
const logAction = async (userId, action, entity = null, entityId = null, details = null, ip = null) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('action', sql.NVarChar, action)
      .input('entity', sql.NVarChar, entity)
      .input('entity_id', sql.Int, entityId)
      .input('details', sql.NVarChar, details ? JSON.stringify(details) : null)
      .input('ip_address', sql.NVarChar, ip)
      .query(`INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
              VALUES (@user_id, @action, @entity, @entity_id, @details, @ip_address)`);
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
};

// Grade access logger
const logGradeAccess = async (userId, gradeId, action, ip = null) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('grade_id', sql.Int, gradeId)
      .input('action', sql.NVarChar, action)
      .input('ip_address', sql.NVarChar, ip)
      .query(`INSERT INTO grade_access_logs (user_id, grade_id, action, ip_address)
              VALUES (@user_id, @grade_id, @action, @ip_address)`);
  } catch (e) {
    console.error('Grade log error:', e.message);
  }
};

module.exports = { authenticate, authorize, logAction, logGradeAccess };
