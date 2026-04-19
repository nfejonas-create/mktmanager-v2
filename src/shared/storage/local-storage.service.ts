import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService } from './storage.interface';

export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;
  
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }
  
  async upload(file: Buffer, filename: string, mimetype: string): Promise<string> {
    // Generate unique filename
    const ext = path.extname(filename);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    
    // Write file
    fs.writeFileSync(filePath, file);
    
    // Return URL
    return `${this.baseUrl}/uploads/${uniqueName}`;
  }
  
  async delete(url: string): Promise<void> {
    // Extract filename from URL
    const filename = path.basename(url);
    const filePath = path.join(this.uploadDir, filename);
    
    // Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}