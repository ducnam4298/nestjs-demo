export enum DecoratorKeys {
  PUBLIC = 'Public',
  ROLES = 'Roles',
  PERMISSIONS = 'Permissions',
}

export enum Position {
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  QA = 'QA',
  HR = 'HR',
  SALES = 'SALES',
}

export enum StatusUser {
  ACTIVATED = 'ACTIVATED',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
}

export enum TypeActionEmail {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export enum DiscountType {
  PERCENTAGE,
  FIXED,
}

export enum DiscountStatus {
  ACTIVE,
  INACTIVE,
}

export enum OrderStatus {
  PLACED, // Đã đặt hàng
  PROCESSING, // Đang xử lý
  CONFIRMED, // Xác nhận giao thành công
  CANCELLED, // Huỷ đơn hàng
  COMPLETED, // Hoàn thành
  RETURNED, // Trả hàng
}
