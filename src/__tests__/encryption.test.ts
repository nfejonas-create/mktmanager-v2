import { EncryptionService } from '../shared/security/encryption.service';

describe('EncryptionService', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  it('encrypts and decrypts a v2 payload', () => {
    const encrypted = EncryptionService.encrypt('super-secret-token');

    expect(encrypted.startsWith('v2:')).toBe(true);
    expect(EncryptionService.decrypt(encrypted)).toBe('super-secret-token');
  });

  it('still decrypts legacy base64 payloads', () => {
    const legacy = Buffer.from('legacy-token').toString('base64');

    expect(EncryptionService.decrypt(legacy)).toBe('legacy-token');
  });
});
