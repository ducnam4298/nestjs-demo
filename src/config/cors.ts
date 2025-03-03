import allowedOrigin from './allowedOrigin';

const corsOrigin = {
  origin: (origin: any, callback: (err: Error | null, success?: boolean) => void) => {
    if (allowedOrigin.indexOf(origin) != -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('NotFound allowed by CORS'));
    }
  },
  originSuccessStatus: 200,
};

export default corsOrigin;
