import instance from "@/config/instance";

export const checkoutOrder = async () => {
  try {
    const response = await instance.post("/orders/checkout");
    return response;
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

export const getOrders = async (params?: {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}) => {
  try {
    const response = await instance.get("/orders", { params });
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

export default {
  checkoutOrder,
  webhookPayos,
  getOrders,
  getOrderDetail,
  cancelOrder,
};
