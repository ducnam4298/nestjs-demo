import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  logTestEnv() {
    console.log(process.env);
    return `Running on VERCEL_ENV: ${process.env.VERCEL_ENV} \n Running on NODE_ENV: ${process.env.NODE_ENV}`;
  }
}
