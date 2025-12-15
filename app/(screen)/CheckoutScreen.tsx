import { userProfileApi } from "@/services/auth";
import { checkoutOrder } from "@/services/order";
import { addressDelivery } from "@/types";
import { formatVND } from "@/utils/imageUtils";
import { Ionicons } from "@expo/vector-icons";
import { getVouchers, Voucher, calculateDiscount } from "@/services/voucher";
import VoucherCard from "@/components/VoucherCard";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [addressList, setAddressList] = useState([]);

  const [selectedAddress, setSelectedAddress] =
    useState<addressDelivery | null>(null);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  const [note, setNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Voucher states
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const items = params.items ? JSON.parse(params.items as string) : [];
  const total = params.total ? Number(params.total) : 0;
  const finalTotal = total - discountAmount;

  useEffect(() => {
    const fetchAddresses = async () => {
      const res = await userProfileApi();
      if (res.data?.success) {
        setAddressList(res.data.deliveryAddresses || []);
        const defaultAddress = res.data.deliveryAddresses.find(
          (addr: addressDelivery) => addr.default
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    };
    fetchAddresses();

    // Fetch vouchers
    const fetchVouchers = async () => {
      try {
        const data = await getVouchers();
        setVouchers(data);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      }
    };
    fetchVouchers();
  }, []);

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
    setIsAddressExpanded(false);
  };

  const formatDateTime = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "set" || selectedDate) {
      if (selectedDate) {
        setDeliveryDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    setDeliveryDate(deliveryDate || new Date());
    setShowDatePicker(false);
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert(
        "Thông báo",
        "Vui lòng chọn địa chỉ giao hàng trước khi đặt hàng."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await checkoutOrder({
        cancelUrl: "http://localhost:3000/checkout/cancel",
        returnUrl: "http://localhost:3000/checkout/success",
        note: note,
        phoneNumber: selectedAddress.phoneNumber.toString(),
        recipientName: selectedAddress.recipientName,
        shippingAddress: `${selectedAddress.address}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`,
        requestDeliveryTime: deliveryDate ? deliveryDate.toISOString() : undefined,
        userId: selectedAddress.userId,
        voucherCode: selectedVoucher?.code || undefined,
      });

      if (response) {
        const { checkoutUrl } = response;
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
        error?.response?.data?.message || "Không thể tạo đơn hàng."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClosePaymentModal = () => {
    Alert.alert("Xác nhận", "Bạn có muốn hủy thanh toán?", [
      { text: "Tiếp tục thanh toán", style: "cancel" },
      {
        text: "Hủy",
        style: "destructive",
        onPress: () => {
          router.replace("/(tabs)/products");
          setShowPaymentModal(false);
          setPaymentUrl("");
          setWebViewLoading(true);
        },
      },
    ]);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
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
      Alert.alert("Đã hủy", "Bạn đã hủy thanh toán", [{ text: "OK" }]);
    }
  };

  const renderAddressItem = (item: any) => {
    const isSelected = selectedAddress?.id === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
        onPress={() => handleSelectAddress(item)}
      >
        <View style={styles.radioContainer}>
          <View
            style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <View style={styles.addressContent}>
          <View style={styles.addressHeaderRow}>
            <Text style={styles.addressName}>{item.recipientName}</Text>
            {item.default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Mặc định</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressPhone}>{item.phoneNumber}</Text>
          <Text style={styles.addressText}>
            {item.address}, {item.ward}, {item.district}, {item.province}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color="#BE123C"
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Voucher handlers
  const handleSelectVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    const discount = calculateDiscount(voucher, total);
    setDiscountAmount(discount);
    setShowVoucherList(false);
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setDiscountAmount(0);
  };

  const getAvailableVouchers = () => {
    const now = new Date();
    const productIds = items.map((item: any) => item.productId);

    return vouchers.filter((voucher) => {
      const startsAt = new Date(voucher.startsAt);
      const endsAt = new Date(voucher.endsAt);

      if (now < startsAt || now > endsAt) return false;
      if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit)
        return false;
      if (voucher.minOrderValue && total < voucher.minOrderValue) return false;

      if (!voucher.applyAllProducts) {
        const hasApplicableProduct = productIds.some((id: number) =>
          voucher.productIds.includes(id)
        );
        if (!hasApplicableProduct) return false;
      }

      return true;
    });
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
        {/* SECTION 1: ĐỊA CHỈ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>
          <View style={styles.addressListContainer}>
            {!isAddressExpanded ? (
              selectedAddress ? (
                <View>
                  {renderAddressItem(selectedAddress)}
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setIsAddressExpanded(true)}
                  >
                    <Text style={styles.expandButtonText}>
                      Thay đổi địa chỉ khác
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectAddressPlaceholder}
                  onPress={() => setIsAddressExpanded(true)}
                >
                  <Ionicons name="location-outline" size={24} color="#BE123C" />
                  <Text style={styles.selectAddressText}>
                    Chọn địa chỉ nhận hàng
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              )
            ) : (
              <View>
                {addressList.map((item) => renderAddressItem(item))}
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={() => setIsAddressExpanded(false)}
                >
                  <Text style={styles.collapseButtonText}>Thu gọn</Text>
                  <Ionicons name="chevron-up" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 2: GHI CHÚ & THỜI GIAN */}
        <View style={styles.section}>
          <View style={styles.formGroup}>
            <View style={styles.formLabelRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#1F2937"
              />
              <Text style={styles.formLabel}>Ghi chú đơn hàng</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Ví dụ: Cẩn thận giúp tôi nhé..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.formLabelRow}>
              <Ionicons name="time-outline" size={18} color="#1F2937" />
              <Text style={styles.formLabel}>
                Thời gian giao hàng mong muốn
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  styles.dateInputValue,
                  !deliveryDate && styles.dateInputPlaceholder,
                ]}
              >
                {deliveryDate
                  ? formatDateTime(deliveryDate)
                  : "--:-- dd/mm/yyyy"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Thời gian chỉ mang tính tham khảo.
            </Text>
          </View>
        </View>

        {/* SECTION 3: VOUCHER */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Mã giảm giá</Text>
            {!selectedVoucher && (
              <TouchableOpacity
                style={styles.btnAddAddress}
                onPress={() => setShowVoucherList(true)}
              >
                <Text style={styles.btnAddAddressText}>Chọn voucher</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedVoucher ? (
            <View>
              <VoucherCard
                voucher={selectedVoucher}
                isSelected={true}
                showConditions={false}
              />
              <TouchableOpacity
                style={styles.removeVoucherButton}
                onPress={handleRemoveVoucher}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.removeVoucherText}>Xóa voucher</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectVoucherPlaceholder}
              onPress={() => setShowVoucherList(true)}
            >
              <Ionicons name="pricetag-outline" size={24} color="#BE123C" />
              <Text style={styles.selectVoucherText}>
                Chọn hoặc nhập mã giảm giá
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* SECTION 4: SẢN PHẨM */}
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
                  {formatVND(item.lineTotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* SECTION 4: THANH TOÁN */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính:</Text>
            <Text style={styles.totalValue}>{formatVND(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={styles.totalValue}>Miễn phí</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Giảm giá:</Text>
              <Text style={[styles.totalValue, { color: "#10B981" }]}>
                -{formatVND(discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelMain}>Tổng cộng:</Text>
            <Text style={styles.totalValueMain}>{formatVND(finalTotal)}</Text>
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
          <Text style={styles.footerTotal}>{formatVND(finalTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (loading || !selectedAddress) && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={loading || !selectedAddress}
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

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoucherList(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowVoucherList(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn Voucher</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {getAvailableVouchers().length > 0 ? (
              getAvailableVouchers().map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  onPress={() => handleSelectVoucher(voucher)}
                  isSelected={selectedVoucher?.id === voucher.id}
                  showConditions={true}
                />
              ))
            ) : (
              <View style={styles.emptyVoucherContainer}>
                <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyVoucherText}>
                  Không có voucher khả dụng
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL WEBVIEW */}
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

      {/* --- DATE PICKER MODAL (ĐÃ FIX UI) --- */}
      {showDatePicker &&
        (Platform.OS === "ios" ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.iosDatePickerOverlay}>
              <View style={styles.iosDatePickerContent}>
                <View style={styles.iosDatePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.iosCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosHeaderTitle}>Chọn thời gian</Text>
                  <TouchableOpacity onPress={confirmIOSDate}>
                    <Text style={styles.iosConfirmText}>Xong</Text>
                  </TouchableOpacity>
                </View>
                {/* ĐÃ THÊM textColor="black" VÀ themeVariant="light" ĐỂ FIX LỖI TRẮNG BÓC */}
                <DateTimePicker
                  value={deliveryDate || new Date()}
                  mode="datetime"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="vi-VN"
                  textColor="black" // FIX CHO IOS
                  themeVariant="light" // FIX CHO IOS
                  style={{ backgroundColor: "white", width: "100%" }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={deliveryDate || new Date()}
            mode="datetime"
            is24Hour={true}
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  content: { flex: 1 },
  section: { backgroundColor: "#FFF", padding: 16, marginTop: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  btnAddAddress: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#BE123C",
  },
  btnAddAddressText: { fontSize: 12, color: "#BE123C", fontWeight: "500" },

  // Address UI
  addressListContainer: { gap: 12 },
  addressCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    alignItems: "flex-start",
  },
  addressCardSelected: { borderColor: "#BE123C", backgroundColor: "#FFF1F2" },
  radioContainer: { marginRight: 12, marginTop: 4 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: { borderColor: "#BE123C" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#BE123C",
  },
  addressContent: { flex: 1 },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: { fontSize: 10, color: "#BE123C", fontWeight: "600" },
  addressPhone: { fontSize: 13, color: "#4B5563", marginBottom: 4 },
  addressText: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  checkIcon: { marginLeft: 8, marginTop: 2 },
  expandButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  expandButtonText: { fontSize: 13, color: "#6B7280", marginRight: 4 },
  collapseButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  collapseButtonText: { fontSize: 13, color: "#6B7280", marginRight: 4 },
  selectAddressPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
  },
  selectAddressText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#4B5563",
  },

  // Voucher Styles
  removeVoucherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    gap: 6,
  },
  removeVoucherText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  selectVoucherPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
  },
  selectVoucherText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#4B5563",
  },
  emptyVoucherContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyVoucherText: {
    fontSize: 16,
    color: "#9CA3AF",
  },

  // Form Styles
  formGroup: { marginBottom: 20 },
  formLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  formLabel: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#FFF",
    height: 80,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  dateInputValue: { fontSize: 14, color: "#1F2937" },
  dateInputPlaceholder: { color: "#9CA3AF" },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },

  // Order Item Styles
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemName: { fontSize: 14, color: "#1F2937", marginBottom: 4 },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQuantity: { fontSize: 13, color: "#6B7280" },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#BE123C" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, color: "#6B7280" },
  totalValue: { fontSize: 14, color: "#1F2937" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  totalLabelMain: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  totalValueMain: { fontSize: 18, fontWeight: "bold", color: "#BE123C" },
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
  paymentMethodText: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
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
  noteText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },
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
  footerLabel: { fontSize: 15, color: "#6B7280" },
  footerTotal: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  checkoutButton: {
    flexDirection: "row",
    backgroundColor: "#047857",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  checkoutButtonDisabled: { backgroundColor: "#9CA3AF" },
  checkoutButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  // Modal Webview
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
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
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  webView: { flex: 1 },
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
  webViewLoadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },

  // IOS DatePicker
  iosDatePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  iosDatePickerContent: {
    backgroundColor: "#FFF",
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  iosCancelText: { color: "#6B7280", fontSize: 16 },
  iosConfirmText: { color: "#047857", fontSize: 16, fontWeight: "600" },
  iosHeaderTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
});
