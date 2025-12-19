import { Ionicons } from "@expo/vector-icons";
import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { authService } from "@/services/auth";
import { getCart } from "@/services/cart";

export default function TabLayout() {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const userId = await authService.getUserId();
      if (!userId) {
        setCartCount(0);
        return;
      }
      const res = await getCart();
      if (res?.data?.items && Array.isArray(res.data.items)) {
        setCartCount(res.data.items.length);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [fetchCartCount])
  );

  const renderCartIcon = ({ color, size }: { color: string; size: number }) => {
    const displayCount =
      cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : "";

    return (
      <View style={{ width: size + 8, height: size + 8, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="cart" size={size} color={color} />
        {cartCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 2,
              borderRadius: 8,
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              {displayCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Sản phẩm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Giỏ hàng",
          tabBarIcon: renderCartIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
