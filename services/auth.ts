import instance from "@/config/instance";

export const userRegisterApi = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
}) => {
  try {
    const response = await instance.post("/auth/register", userData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const userLoginApi = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await instance.post("/auth/login", credentials);
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  userRegisterApi,
  userLoginApi,
};
