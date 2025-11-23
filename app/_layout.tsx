import { Stack } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  View,
} from "react-native";

export default function RootLayout() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
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
        name="(screen)/about-us"
        options={{
          title: "Về chúng tôi",
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
        name="orders/all-orders"
        options={{
          title: "Tất cả đơn hàng",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders/process-orders"
        options={{
          title: "Đơn hàng đang sử lí",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders/delivered-orders"
        options={{
          title: "Đơn hàng đang đã giao",
          headerShown: false,
        }}
      />
          </Stack>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
