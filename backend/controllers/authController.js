const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/db');
const { logAction } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, pdpa_consent } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!pdpa_consent) {
    return res.status(400).json({ message: 'PDPA consent is required to register' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const pool = await getPool();
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await hashPassword(password);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, hash)
      .input('role', sql.NVarChar, 'student')
      .input('pdpa_consent', sql.Bit, 1)
      .query(`INSERT INTO users (name, email, password_hash, role, pdpa_consent)
              OUTPUT INSERTED.id
              VALUES (@name, @email, @password_hash, @role, @pdpa_consent)`);

    const newId = result.recordset[0].id;
    await logAction(newId, 'REGISTER', 'users', newId, { email }, req.ip);

    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email AND is_deleted = 0');

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
      await logAction(user.id, 'LOGIN_FAILED', 'users', user.id, null, req.ip);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAction(user.id, 'LOGIN', 'users', user.id, null, req.ip);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, name FROM users WHERE email = @email AND is_deleted = 0');

    // Always return success (don't reveal if email exists)
    if (result.recordset.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.recordset[0];
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.request()
      .input('user_id', sql.Int, user.id)
      .input('token', sql.NVarChar, token)
      .input('expires_at', sql.DateTime, expires)
      .query(`INSERT INTO password_reset_tokens (user_id, token, expires_at)
              VALUES (@user_id, @token, @expires_at)`);

    // Simulate email - log to console
    console.log(`\n📧 PASSWORD RESET EMAIL (simulated)`);
    console.log(`To: ${email}`);
    console.log(`Subject: Reset Your Password`);
    console.log(`Reset Link: http://localhost:5173/reset-password?token=${token}`);
    console.log(`Expires: ${expires.toISOString()}\n`);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`SELECT * FROM password_reset_tokens
              WHERE token = @token AND used = 0 AND expires_at > GETDATE()`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const reset = result.recordset[0];
    const hash = await hashPassword(password);

    await pool.request()
      .input('hash', sql.NVarChar, hash)
      .input('id', sql.Int, reset.user_id)
      .query('UPDATE users SET password_hash = @hash, updated_at = GETDATE() WHERE id = @id');

    await pool.request()
      .input('token', sql.NVarChar, token)
      .query('UPDATE password_reset_tokens SET used = 1 WHERE token = @token');

    await logAction(reset.user_id, 'PASSWORD_RESET', 'users', reset.user_id, null, req.ip);

    res.json({ message: 'Password reset successfully. You may now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/me
const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, forgotPassword, resetPassword, logout, me };
