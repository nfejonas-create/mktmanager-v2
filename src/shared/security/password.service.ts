import bcrypt from 'bcrypt';

const PASSWORD_ROUNDS = 12;

export class PasswordService {
  static hash(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_ROUNDS);
  }

  static verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
