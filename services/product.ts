import instance from "@/config/instance";

export const getAllProduct = async (params: {
  type?: string;
  active?: boolean;
  categoryId?: string;
  pageNumber?: number;
  pageSize?: number;
  categoryIds?: string[];
}) => {
  try {
    const response = await instance.get("/products/get-list-product", {
      params,
    });
    return response;
  } catch (error) {
    throw error;
  }
};
export const getProductDetail = async (productId: number) => {
  try {
    const response = await instance.get(
      `/products/get-product-by-id?id=${productId}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getProductsByType = async (params: {
  type?: string;
  active?: boolean;
  pageNumber?: number;
  pageSize?: number;
  custom?: boolean;
}) => {
  try {
    const response = await instance.get("/products/get-list-product-by-user", {
      params,
    });
    return response;
  } catch (error) {
    throw error;
  }
};
export const createCustomProduct = async (data: {
  name: string;
  description?: string;
  images?: string[];
  compositions: Array<{
    childId: number;
    childName?: string;
    quantity: number;
    childPrice?: number;
  }>;
}) => {
  try {
    const response = await instance.post("/products/create-product", {
      name: data.name,
      description: data.description,
      images: JSON.stringify(data.images || []),
      productType: "PRODUCT",
      custom: true,
      isActive: true,
      compositions: data.compositions.map((comp) => ({
        childProductId: comp.childId,
        quantity: comp.quantity,
      })),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserAddresses = async () => {
  try {
    const response = await instance.get("/addresses/get-list-addresses");
    return response;
  } catch (error) {
    throw error;
  }
};

export const createOrderForCustomProduct = async (data: {
  productId?: number;
  customProduct?: {
    name: string;
    description?: string;
    images?: string[];
    compositions: Array<{
      childId: number;
      childName: string;
      quantity: number;
      childPrice: number;
    }>;
  };
  quantity: number;
  shippingAddress: string;
  phoneNumber: string;
  recipientName?: string;
  note?: string;
  requestDeliveryTime?: string;
}) => {
  try {
    const response = await instance.post("/orders/create-order", data);
    return response;
  } catch (error) {
    throw error;
  }
};
