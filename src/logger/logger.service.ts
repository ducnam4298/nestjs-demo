import { ConsoleLogger, Injectable } from '@nestjs/common';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
// import cron from 'node-cron'; // Nếu bạn sử dụng node-cron

@Injectable()
export class LoggerService extends ConsoleLogger {
  private static instance: LoggerService = new LoggerService();

  private constructor() {
    super();

    // Cách 1: Sử dụng setInterval để dọn dẹp logs mỗi ngày (24 giờ)
    setInterval(
      () => {
        void this.cleanupOldLogs(path.join(__dirname, '..', '..', 'logs'));
      },
      24 * 60 * 60 * 1000
    ); // 24 giờ

    // Cách 2: Sử dụng node-cron để dọn dẹp logs vào nửa đêm mỗi ngày
    // cron.schedule('0 0 * * *', () => {
    //   this.cleanupOldLogs(path.join(__dirname, '..', '..', 'logs'));
    //   console.log('✅ Log cleanup completed');
    // });
  }

  private async logToFile(entry: string) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const formattedEntry = `${now.toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Chicago',
    })}\t${entry}\n`;

    try {
      const logDir = path.join(__dirname, '..', '..', 'logs');
      const logFilePath = path.join(logDir, `${dateStr}.log`);

      if (!fs.existsSync(logDir)) {
        await fsPromises.mkdir(logDir, { recursive: true });
      }

      await fsPromises.appendFile(logFilePath, formattedEntry);
      await this.cleanupOldLogs(logDir); // Dọn dẹp log sau khi ghi mới
    } catch (e) {
      console.error('❌ Failed to write log:', e);
    }
  }

  // Hàm dọn dẹp các file log cũ hơn 30 ngày
  private async cleanupOldLogs(logDir: string) {
    const files = await fsPromises.readdir(logDir);
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = await fsPromises.stat(filePath);

      if (currentTime - stats.mtimeMs > thirtyDaysInMs) {
        try {
          await fsPromises.unlink(filePath);
          console.log(`✅ Deleted log file: ${file}`);
        } catch (error) {
          console.error(`❌ Failed to delete log file: ${file}`, error);
        }
      }
    }
  }

  static log(message: any, context?: string) {
    const entry = `${context || 'Log'}\t${message}`;
    void this.instance.logToFile(entry);
    super.prototype.log.call(this.instance, message, context);
  }

  static error(message: any, stackOrContext?: string) {
    const entry = `${stackOrContext || 'Error'}\t${message}`;
    void this.instance.logToFile(entry);
    super.prototype.error.call(this.instance, message, stackOrContext);
  }

  static warn(message: any, context?: string) {
    const entry = `${context || 'Warning'}\t${message}`;
    void this.instance.logToFile(entry);
    super.prototype.warn.call(this.instance, message, context);
  }
}
