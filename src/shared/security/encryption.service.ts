import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_PREFIX = 'v2';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY is required');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }

  return Buffer.from(key, 'hex');
}

function decodeLegacyBase64(value: string): string {
  return Buffer.from(value, 'base64').toString('utf8');
}

export class EncryptionService {
  static encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      ENCRYPTION_PREFIX,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64')
    ].join(':');
  }

  static decrypt(value: string): string {
    if (value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
      const [, ivBase64, tagBase64, encryptedBase64] = value.split(':');

      if (!ivBase64 || !tagBase64 || !encryptedBase64) {
        throw new Error('Invalid encrypted payload format');
      }

      const decipher = createDecipheriv(
        'aes-256-gcm',
        getEncryptionKey(),
        Buffer.from(ivBase64, 'base64')
      );
      decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    }

    return decodeLegacyBase64(value);
  }
}
