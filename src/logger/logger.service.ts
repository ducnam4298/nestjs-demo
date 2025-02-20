import { ConsoleLogger, Injectable } from '@nestjs/common';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private static instance: LoggerService = new LoggerService();

  private constructor() {
    super();
  }

  private async logToFile(entry: string) {
    const formattedEntry = `${new Date().toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Chicago',
    })}\t${entry}\n`;

    try {
      const logDir = path.join(__dirname, '..', '..', 'logs');
      const logFilePath = path.join(logDir, 'muLogFile.log');

      if (!fs.existsSync(logDir)) {
        await fsPromises.mkdir(logDir);
      }
      await fsPromises.appendFile(logFilePath, formattedEntry);
    } catch (e) {
      console.error('Failed to write log:', e);
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
