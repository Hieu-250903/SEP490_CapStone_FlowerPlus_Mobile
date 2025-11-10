import instance from "@/config/instance";
import { AddToCartRequest, UpdateCartItemRequest } from "@/types";

export const getCart = async () => {
  try {
    const response = await instance.get("/cart");
    return response;
  } catch (error) {
    throw error;
  }
};

export const addToCart = async (data: AddToCartRequest) => {
  try {
    const response = await instance.post("/cart/items", data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateCartItem = async (
  userId: number,
  itemId: number,
  data: UpdateCartItemRequest
) => {
  try {
    const response = await instance.put(`/cart/items/${itemId}`, data, {
      params: { userId },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeCartItem = async (userId: number, itemId: number) => {
  try {
    const response = await instance.delete(`/cart/items/${itemId}`, {
      params: { userId },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const clearCart = async (userId: number) => {
  try {
    const response = await instance.delete("/cart/items", {
      params: { userId },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
