const getAllCategories = async (params: {
  keyword: number;
  pageLnumber: number;
  size: number;
}) => {
  try {
    const response = await instance.get("/categories", {
      params: params,
    });
    return response;
  } catch (error) {
    throw error;
  }
};
const getDetailCategory = async (id: string) => {
  try {
    const response = await instance.get(`/categories/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
module.exports = { getAllCategories, getDetailCategory };
