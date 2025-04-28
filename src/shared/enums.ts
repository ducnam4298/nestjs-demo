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

export enum DataTypeAttribute {
  String = 'String',
  Number = 'Number',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum DiscountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum OrderStatus {
  PLACED = 'PLACED', // Đã đặt hàng
  PROCESSING = 'PROCESSING', // Đang xử lý
  CONFIRMED = 'CONFIRMED', // Xác nhận giao thành công
  CANCELLED = 'CANCELLED', // Huỷ đơn hàng
  COMPLETED = 'COMPLETED', // Hoàn thành
  RETURNED = 'RETURNED', // Trả hàng
}
