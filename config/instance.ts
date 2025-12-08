import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const instance = axios.create({
  baseURL: "https://flower.autopass.blog/api",
});

instance.interceptors.request.use(
  async function (config) {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    return response.data;
  },
  async function (error) {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      await AsyncStorage.multiRemove(["auth_token", "user_data"]);

      router.replace("/(auth)/login");
    }

    return Promise.reject(error);
  }
);

export default instance;
