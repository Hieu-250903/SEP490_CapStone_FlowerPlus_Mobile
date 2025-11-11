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
