import instance from "@/config/instance";

interface CheckoutPayload {
  cancelUrl: string;
  // URL 用户取消支付后返回的链接，可选
  returnUrl?: string | null;
  note: string;
  // 一些场景（比如自定义花）不会单独传电话和收件人，因此设为可选
  phoneNumber?: string;
  recipientName?: string;
  // 允许为空（例如不选择具体送达时间）
  requestDeliveryTime?: string | null;
  shippingAddress: string;
  // 有的接口只需要 userId，有的场景（如访客）可能没有
  userId?: number;
  // 下单商品 ID（可选，因为 checkoutOrder 没用到）
  productId?: number;
  // 使用的优惠码（仅普通结算在用）
  voucherCode?: string | null;
  // 结算数量（仅 checkout-product 使用）
  quantity?: number;
}

export const checkoutOrder = async (data: CheckoutPayload) => {
  try {
    const response = await instance.post("/orders/checkout", data);
    return response.data;
  } catch (error) {
    console.error("Error checkout order:", error);
    throw error;
  }
};
export const checkoutProduct = async (data: CheckoutPayload) => {
  try {
    const response = await instance.post("/orders/checkout-product", data);
    return response.data;
  } catch (error) {
    console.error("Error checkout order:", error);
    throw error;
  }
};
export const webhookPayos = async (webhookData: string) => {
  try {
    const response = await instance.post("/orders/webhook-payos", webhookData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error("Error webhook payos:", error);
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const response = await instance.get("/orders/get-list-orders-by-user");
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
};

export const getOrderDetail = async (orderId: number) => {
  try {
    const response = await instance.get(`/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error("Error getting order detail:", error);
    throw error;
  }
};

export const getOrderByCode = async (orderCode: string) => {
  try {
    const response = await instance.get(`/orders/get-order-by-code?orderCode=${orderCode}`);
    return response;
  } catch (error) {
    console.error("Error getting order by code:", error);
    throw error;
  }
};

export const cancelOrder = async (orderId: number) => {
  try {
    const response = await instance.post(`/orders/${orderId}/cancel`);
    return response;
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error;
  }
};
export const getListTransactionsByUser = async () => {
  try {
    const response = await instance.get("/transactions/get-list-transactions");
    return response;
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

export const getListOrdersByShipper = async () => {
  try {
    const response = await instance.get("/orders/get-list-orders");
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
};
export const updateOrderStatus = async (orderId: number, formData: {
  step: string,
  note: string,
  location?: string,
  imageUrl: string
}) => {
  try {
    const response = await instance.post(`/orders/${orderId}/delivery-status/set`, formData);
    return response;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};
export default {
  checkoutOrder,
  webhookPayos,
  getOrders,
  getOrderDetail,
  getOrderByCode,
  cancelOrder,
  getListOrdersByShipper,
  updateOrderStatus,
};
