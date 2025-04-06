import { StatusUser } from '@/shared';

export const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';
export const PORT = process.env.PORT ?? 3000;
export const DEFAULT_PERMISSION = ['VIEWS', 'DETAIL', 'CREATE', 'UPDATE', 'DELETE'];
export const NameStatusUser = (status?: string | null): string => {
  const statusName = status as StatusUser;
  if (!statusName) {
    return 'disabled';
  }
  if (statusName === StatusUser.BLOCKED) {
    return 'blocked';
  } else if (statusName === StatusUser.PENDING) {
    return 'pending';
  }
  return 'activated';
};
