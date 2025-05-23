import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
// import cron from 'node-cron'; // Nếu sử dụng node-cron

@Injectable()
export class LoggerService extends ConsoleLogger {
  private logWorkerInterval: NodeJS.Timeout;
  private logCleanupInterval: NodeJS.Timeout;

  private static _instance: LoggerService | null = null;

  static get instance(): LoggerService {
    if (!this._instance) {
      this._instance = new LoggerService();
    }
    return this._instance;
  }
  private logQueue: string[] = [];
  private isWriting = false;
  private logDir: string = (() => {
    if (
      process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL_ENV === 'preview' ||
      process.env.NODE_ENV === 'production'
    ) {
      return '/tmp';
    }
    const localDir = path.join(__dirname, '..', '..', 'tmp');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  })();
  private logFilePath = path.join(this.logDir, `${new Date().toISOString().slice(0, 10)}.log`);

  private constructor() {
    super();
    if (!LoggerService._instance) {
      LoggerService._instance = this;
    }
    this.ensureLogDirectory();
    this.startLogWorker();
    this.scheduleLogCleanup();
  }

  onModuleDestroy() {
    void this.writeLogsToFile();
    LoggerService.stopIntervals();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private async writeLogsToFile() {
    if (this.isWriting || this.logQueue.length === 0) return;
    this.isWriting = true;

    const now = new Date();
    const formattedTime = now.toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Chicago',
    });
    const logsToWrite = this.logQueue.map(log => `${formattedTime}\t${log}`).join('\n') + '\n';
    this.logQueue = [];

    try {
      await fs.promises.appendFile(this.logFilePath, logsToWrite);
      await this.cleanupOldLogs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      LoggerService.error('🚨 Logger Error:', errorMessage);
      const errorLogPath = path.join(this.logDir, 'error.log');
      await fs.promises.appendFile(
        errorLogPath,
        `[${new Date().toISOString()}] Logger Error: ${errorMessage}\n`
      );
    }

    this.isWriting = false;
  }

  private startLogWorker() {
    this.logWorkerInterval = setInterval(() => {
      void this.writeLogsToFile();
    }, 500);
  }

  private scheduleLogCleanup() {
    // Cách 1: Sử dụng setInterval để dọn dẹp logs mỗi ngày (24 giờ)
    this.logCleanupInterval = setInterval(
      () => {
        void this.cleanupOldLogs();
      },
      24 * 60 * 60 * 1000
    ); // 24 giờ

    // Cách 2: Sử dụng node-cron để dọn dẹp logs vào nửa đêm mỗi ngày
    // cron.schedule('0 0 * * *', () => {
    //   void this.cleanupOldLogs();
    //   console.log('✅ Log cleanup completed');
    // });
  }

  static stopIntervals() {
    if (this.instance.logWorkerInterval) clearInterval(this.instance.logWorkerInterval);
    if (this.instance.logCleanupInterval) clearInterval(this.instance.logCleanupInterval);
  }

  private async cleanupOldLogs() {
    try {
      const files = await fsPromises.readdir(this.logDir);
      const thirtyDaysInMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = path.join(this.logDir, file);
        const stats = await fsPromises.stat(filePath);

        if (stats.mtimeMs < thirtyDaysInMs) {
          await fsPromises.unlink(filePath);
          LoggerService.log(`✅ Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error('❌ Error cleaning up logs:', errorMessage);
    }
  }

  private queueLog(log: string) {
    this.logQueue.push(log);
  }

  static log(message: any, context?: string) {
    const logEntry = `[INFO] ${context || 'Application'}: ${message}`;
    console.log(logEntry);
    this.instance.queueLog(logEntry);
  }

  static error(message: any, context?: string) {
    const logEntry = `[ERROR] ${context || 'Application'}: ${message}`;
    console.error(logEntry);
    this.instance.queueLog(logEntry);
  }

  static warn(message: any, context?: string) {
    const logEntry = `[WARN] ${context || 'Application'}: ${message}`;
    console.warn(logEntry);
    this.instance.queueLog(logEntry);
  }

  static debug(message: any, context?: string) {
    const logEntry = `[DEBUG] ${context || 'Application'}: ${message}`;
    console.debug(logEntry);
    this.instance.queueLog(logEntry);
  }
}
