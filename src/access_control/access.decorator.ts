import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const CustomThrottle = (key: string, ttl: number, limit: number) =>
  Throttle({ [key]: { ttl, limit } });

/**
 * **🔐 Auth Throttle - Giới hạn tốc độ cho các API xác thực**
 * - ✅ Chỉ cho phép 5 request mỗi 60 giây (1 phút)
 * - 📌 Dùng cho login, register, forgot password
 */
export const AuthThrottle = () => CustomThrottle('auth', 60, 5);

/**
 * **💳 Payment Throttle - Giới hạn tốc độ cho API thanh toán**
 * - ✅ Chỉ cho phép 3 request mỗi 600 giây (10 phút)
 * - 📌 Tránh spam giao dịch/thanh toán liên tục
 */
export const PaymentThrottle = () => CustomThrottle('payment', 60, 5);

/**
 * **🌍 Public API Throttle - Giới hạn tốc độ cho API công khai**
 * - ✅ Cho phép tối đa 100 request mỗi 60 giây
 * - 📌 Dùng cho các API mở, không yêu cầu xác thực (tin tức, danh sách sản phẩm)
 */
export const PublicThrottle = () => CustomThrottle('public', 60, 5);

/**
 * **📧 Email API Throttle - Giới hạn tốc độ cho API gửi email**
 * - ✅ Chỉ cho phép 3 request mỗi 300 giây (5 phút)
 * - 📌 Tránh spam gửi email tự động
 */
export const EmailThrottle = () => CustomThrottle('email', 60, 5);

/**
 * **⚠ Report API Throttle - Giới hạn tốc độ cho API báo cáo lỗi**
 * - ✅ Chỉ cho phép 5 request mỗi 300 giây (5 phút)
 * - 📌 Tránh spam báo cáo lỗi liên tục
 */
export const ReportThrottle = () => CustomThrottle('report', 60, 5);

/**
 * **📂 File Download Throttle - Giới hạn tải tệp**
 * - ✅ Tối đa 10 request mỗi 60 giây
 * - 📌 Tránh tải file quá mức trong thời gian ngắn
 */
export const FileDownloadThrottle = () => CustomThrottle('fileDownload', 60, 5);

/**
 * **📤 File Upload Throttle - Giới hạn tốc độ tải lên file**
 * - ✅ Tối đa 3 request mỗi 120 giây (2 phút)
 * - 📌 Tránh spam upload file gây quá tải server
 */
export const FileUploadThrottle = () => CustomThrottle('fileUpload', 60, 5);

/**
 * **🔍 Search API Throttle - Giới hạn tốc độ tìm kiếm**
 * - ✅ Tối đa 5 request mỗi 10 giây
 * - 📌 Tránh spam search làm chậm hệ thống
 */
export const SearchThrottle = () => CustomThrottle('search', 60, 5);

/**
 * **💬 Chat API Throttle - Giới hạn gửi tin nhắn**
 * - ✅ Tối đa 10 request mỗi 10 giây
 * - 📌 Tránh spam tin nhắn trong thời gian ngắn
 */
export const ChatThrottle = () => CustomThrottle('chat', 60, 5);
