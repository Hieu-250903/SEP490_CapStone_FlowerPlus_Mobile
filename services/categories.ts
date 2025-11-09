import instance from "@/config/instance";

export const getAllCategories = async () => {
  try {
    const response = await instance.get("/categories/tree");
    return response;
  } catch (error) {
    throw error;
  }
};
export const getDetailCategory = async (id: string) => {
  try {
    const response = await instance.get(`/categories/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
