import { StatusUser } from '@prisma/client';

export const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';
export const PORT = process.env.PORT ?? 3000;
export const DEFAULT_PERMISSION = ['VIEWS', 'DETAIL', 'CREATE', 'UPDATE', 'DELETE'];
export const NameStatusUser = (status?: StatusUser | null) => {
  if (!status) {
    return 'disabled';
  }
  if (status === StatusUser.BLOCKED) {
    return 'blocked';
  } else if (status === StatusUser.PENDING) {
    return 'pending';
  }
  return 'activated';
};
