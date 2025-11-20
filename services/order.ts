import instance from "@/config/instance";

interface CheckoutPayload {
  cancelUrl: string;
  returnUrl: string;
  note: string;
  phoneNumber: string;
  recipientName: string;
  requestDeliveryTime?: string;
  shippingAddress: string;
  userId: number;
  productId?: number;
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
export default {
  checkoutOrder,
  webhookPayos,
  getOrders,
  getOrderDetail,
  cancelOrder,
};
