import CryptoJS from 'crypto-js';

export class EncryptionService {
  static encrypt(text: string): string {
    // Simples base64 encode para testes - em produção usar AES real
    return Buffer.from(text).toString('base64');
  }
  
  static decrypt(encryptedText: string): string {
    // Simples base64 decode para testes
    return Buffer.from(encryptedText, 'base64').toString('utf8');
  }
}