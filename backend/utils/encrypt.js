// encrypt.js
const crypto = require('crypto');
const ALGO = 'aes-256-cbc';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  // Prependemos el IV para luego descifrar:
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encrypted) {
  const [ivHex, dataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };