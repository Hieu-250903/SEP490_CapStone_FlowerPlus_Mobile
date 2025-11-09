import { checkoutOrder } from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);

  const items = params.items ? JSON.parse(params.items as string) : [];
  const total = params.total ? Number(params.total) : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await checkoutOrder();
      console.log("Checkout response:", response);

      if (response?.success) {
        const { checkoutUrl } = response.data;

        if (checkoutUrl) {
          setPaymentUrl(checkoutUrl);
          setShowPaymentModal(true);
        } else {
          Alert.alert("Lỗi", "Không tìm thấy link thanh toán");
        }
      } else {
        Alert.alert("Lỗi", response?.message || "Không thể tạo đơn hàng");
      }
    } catch (error: any) {
      console.error("Error checkout:", error);
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClosePaymentModal = () => {
    Alert.alert("Xác nhận", "Bạn có muốn hủy thanh toán?", [
      {
        text: "Tiếp tục thanh toán",
        style: "cancel",
      },
      {
        text: "Hủy",
        style: "destructive",
        onPress: () => {
          setShowPaymentModal(false);
          setPaymentUrl("");
          setWebViewLoading(true);
        },
      },
    ]);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log("WebView URL:", url);

    if (url.includes("/success") || url.includes("success=true")) {
      setShowPaymentModal(false);
      Alert.alert("Thành công", "Thanh toán thành công!", [
        {
          text: "Xem đơn hàng",
          onPress: () => router.replace("/(tabs)/orders"),
        },
      ]);
    } else if (url.includes("/cancel") || url.includes("cancel=true")) {
      setShowPaymentModal(false);
      Alert.alert("Đã hủy", "Bạn đã hủy thanh toán", [
        {
          text: "OK",
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
          {items.map((item: any) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.productName}
              </Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.lineTotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính:</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={styles.totalValue}>Miễn phí</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelMain}>Tổng cộng:</Text>
            <Text style={styles.totalValueMain}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name="card-outline" size={24} color="#047857" />
            <Text style={styles.paymentMethodText}>PayOS</Text>
          </View>
        </View>

        <View style={styles.noteSection}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6B7280"
          />
          <Text style={styles.noteText}>
            Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán của PayOS
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Tổng thanh toán:</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            loading && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.checkoutButtonText}>Đặt hàng</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClosePaymentModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleClosePaymentModal}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thanh toán PayOS</Text>
            <View style={{ width: 40 }} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.webViewLoadingText}>
                Đang tải trang thanh toán...
              </Text>
            </View>
          )}

          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webView}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFF",
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemName: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
  },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 13,
    color: "#6B7280",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#BE123C",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 14,
    color: "#1F2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  totalLabelMain: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalValueMain: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BE123C",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#047857",
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  footer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  checkoutButton: {
    flexDirection: "row",
    backgroundColor: "#047857",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  checkoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  webView: {
    flex: 1,
  },
  webViewLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    zIndex: 1,
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
});
