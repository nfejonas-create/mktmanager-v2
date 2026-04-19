export interface IStorageService {
  upload(file: Buffer, filename: string, mimetype: string): Promise<string>;
  delete(url: string): Promise<void>;
}