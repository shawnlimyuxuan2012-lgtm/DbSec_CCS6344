const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2 = promisify(crypto.pbkdf2);

const ALGORITHM = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';
const SALT_LENGTH = 16;

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('base64url');
  const derivedKey = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return `${ALGORITHM}$${ITERATIONS}$${salt}$${derivedKey.toString('base64url')}`;
};

const verifyPassword = async (password, storedHash) => {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const [algorithm, iterationsRaw, salt, hash] = storedHash.split('$');
  if (algorithm !== ALGORITHM || !iterationsRaw || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1) {
    return false;
  }

  const expected = Buffer.from(hash, 'base64url');
  const actual = await pbkdf2(password, salt, iterations, expected.length, DIGEST);

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
};

module.exports = { hashPassword, verifyPassword };
