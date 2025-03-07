import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DecoratorKeys } from '@/shared/enums';

export const Metadata = {
  Public: () => SetMetadata(DecoratorKeys.PUBLIC, true),
  Permissions: (...permissions: string[]) => SetMetadata(DecoratorKeys.PERMISSIONS, permissions),
  Roles: (...roles: string[]) => SetMetadata(DecoratorKeys.ROLES, roles),
};

const CustomThrottle = (key: string, ttl: number, limit: number) =>
  Throttle({ [key]: { ttl, limit } });

export const Throttles = {
  /** 🔐 Auth Throttle: 5 request / 60s */
  Auth: () => CustomThrottle('auth', 60, 5),

  /** 💳 Payment Throttle: 3 request / 600s */
  Payment: () => CustomThrottle('payment', 600, 3),

  /** 🌍 Public API Throttle: 100 request / 60s */
  Public: () => CustomThrottle('public', 60, 100),

  /** 📧 Email API Throttle: 3 request / 300s */
  Email: () => CustomThrottle('email', 300, 3),

  /** ⚠ Report API Throttle: 5 request / 300s */
  Report: () => CustomThrottle('report', 300, 5),

  /** 📂 File Download Throttle: 10 request / 60s */
  FileDownload: () => CustomThrottle('fileDownload', 60, 10),

  /** 📤 File Upload Throttle: 3 request / 120s */
  FileUpload: () => CustomThrottle('fileUpload', 120, 3),

  /** 🔍 Search API Throttle: 5 request / 10s */
  Search: () => CustomThrottle('search', 10, 5),

  /** 💬 Chat API Throttle: 10 request / 10s */
  Chat: () => CustomThrottle('chat', 10, 10),
};
