export interface Product {
  id: number;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  label?: string | null;
  labelColor?: string;
  image: string;
  description?: string;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  children?: string[];
  description: string;
  pparentId?: string;
}
export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  totalPrice: number;
  items: CartItem[];
}

export interface UserData {
  sub: string;
  email: string;
  user_name: string;
  role: string;
  id: number;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
}
export interface CheckoutResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: number;
    totalAmount: number;
    paymentUrl?: string;
  };
}

export interface WebhookPayosRequest {
  orderCode: string;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}
export interface addressDelivery {
  address: string;
  createdAt: Date;
  default: boolean;
  district: string;
  id: number;
  phoneNumber: number;
  province: string;
  recipientName: string;
  updatedAt: Date;
  userId: number;
  ward: string;
}
