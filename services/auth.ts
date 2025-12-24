import instance from "@/config/instance";
import { LoginResponse, RegisterData } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

export const userRegisterApi = async (userData: RegisterData) => {
  try {
    const response = await instance.post("/auth/register", userData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyEmailApi = async (data: {
  email: string;
  verificationCode: string;
}) => {
  try {
    const response = await instance.post("/auth/verify-email", data);
    return response;
  } catch (error) {
    throw error;
  }
};
export const getUserInfoApi = async () => {
  try {
    const response = await instance.get("/auth/me");
    return response;
  } catch (error) {
    throw error;
  }
};
export const userLoginApi = async (credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  try {
    const requestData = {
      username: credentials.email,
      password: credentials.password,
    };
    console.log("Login request data:", requestData);
    const response = await instance.post("/auth/login", requestData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const userProfileApi = async () => {
  try {
    const response = await instance.get("/auth/me?includeRole=false");
    return response;
  } catch (error) {
    throw error;
  }
};

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatar?: string;
}

export const updateProfileApi = async (data: UpdateProfileData) => {
  try {
    const response = await instance.post("/auth/update-profile", data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const changePasswordApi = async (data: {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) => {
  try {
    const response = await instance.post("/auth/change-password", data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const authService = {
  decodeToken: (token: string): UserData | null => {
    try {
      const decoded = jwtDecode<UserData>(token);
      return decoded;
    } catch (error) {
      return null;
    }
  },

  saveAuth: async (token: string): Promise<boolean> => {
    try {
      const userData = authService.decodeToken(token);

      if (!userData) {
        throw new Error("Invalid token");
      }

      await AsyncStorage.setItem(TOKEN_KEY, token);

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      return false;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  getUser: async (): Promise<UserData | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  getUserId: async (): Promise<number | null> => {
    try {
      const user = await authService.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  },

  isTokenValid: async (): Promise<boolean> => {
    try {
      const token = await authService.getToken();
      if (!token) return false;

      const userData = authService.decodeToken(token);
      if (!userData) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = userData.exp > currentTime;

      if (!isValid) {
        await authService.clearAuth();
      }

      return isValid;
    } catch (error) {
      return false;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await authService.getToken();
      if (!token) return false;

      return await authService.isTokenValid();
    } catch (error) {
      return false;
    }
  },

  clearAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
    }
  },

  logout: async (): Promise<void> => {
    try {
      await authService.clearAuth();
      console.log("Logout successfully");
    } catch (error) {
      console.log("Error during logout:", error);
    }
  },

  refreshUserData: async (): Promise<UserData | null> => {
    try {
      const response = await userProfileApi();
      if (response?.data) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
        return response.data;
      }
      return null;
    } catch (error) {
      console.log("Error refreshing user data:", error);
      return null;
    }
  },

  getAuthHeader: async (): Promise<{ Authorization: string } | {}> => {
    try {
      const token = await authService.getToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    } catch (error) {
      console.log("Error getting auth header:", error);
      return {};
    }
  },
};

export default {
  userRegisterApi,
  userLoginApi,
  userProfileApi,
  verifyEmailApi,
  authService,
};
