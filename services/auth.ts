import instance from "@/config/instance";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
export const userProfileApi = async () => {
  try {
    const response = await instance.get(
      "/auth/me?includeRole=false"
    );
    return response;
  } catch (error) {}
};

export const authService = {
  async saveAuth(token: string, user: any) {
    try {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Error saving auth:", error);
      throw error;
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem("token");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  async getUser() {
    try {
      const userStr = await AsyncStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem("token");
      return !!token;
    } catch (error) {
      return false;
    }
  },

  async clearAuth() {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Error clearing auth:", error);
      throw error;
    }
  },
};
export default {
  userRegisterApi,
  userLoginApi,
};
