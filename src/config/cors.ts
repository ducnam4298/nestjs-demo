import { allowedOrigin } from '.';

export const corsOrigin = {
  origin: (origin, callback: (err: Error | null, success?: boolean) => void) => {
    if (!origin || allowedOrigin.indexOf(origin) !== -1) {
      callback(null, true);
      return;
    }
    const previewPattern = /^https:\/\/nestjs-demo-.*-nates-projects-.*\.vercel\.app$/;
    if (typeof origin === 'string' && previewPattern.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('NotFound allowed by CORS'));
  },
  originSuccessStatus: 200,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};
