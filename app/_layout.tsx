import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/register"
        options={{
          title: "Đăng nhập",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/login"
        options={{
          title: "Đăng nhập",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/CheckoutScreen"
        options={{
          title: "Thanh toán",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/transactions-history"
        options={{
          title: "Lịch sử thanh toán",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/custom-flowers"
        options={{
          title: "Lịch sử thanh toán",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/vouchers"
        options={{
          title: "Lịch sử thanh toán",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/user-info"
        options={{
          title: "Thông tin cá nhân",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/chatbot"
        options={{
          title: "Trợ lý ảo",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screen)/shipper"
        options={{
          title: "Lịch sử thanh toán",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders/all-orders"
        options={{
          title: "Tất cả đơn hàng",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
