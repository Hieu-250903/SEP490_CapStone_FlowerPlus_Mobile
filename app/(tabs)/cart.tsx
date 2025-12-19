import { authService } from "@/services/auth";
import { clearCart, getCart, removeCartItem, updateCartItem } from "@/services/cart";
import { CartItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getProductImage = (imageData: string | null | undefined): string => {
  try {
    if (!imageData) {
      return "https://via.placeholder.com/400";
    }

    if (imageData.startsWith("[")) {
      const imageArray = JSON.parse(imageData);
      return imageArray[0] || "https://via.placeholder.com/400";
    }

    return imageData;
  } catch (error) {
    return "https://via.placeholder.com/400";
  }
};

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCart();
      }
      return () => {};
    }, [userId])
  );

  const initializeUser = async () => {
    const id = await authService.getUserId();
    if (!id) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để xem giỏ hàng", [
        {
          text: "Đăng nhập",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
      return;
    }
    setUserId(id);
    fetchCart();
  };

  const fetchCart = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getCart();
      if (response?.data) {
        const items = (response.data.items || []) as CartItem[];
        setCartItems(items);
        setTotalPrice(response.data.totalPrice || 0);

        if (items.length > 0) {
          const allIds = new Set<number>(items.map((item: CartItem) => item.id));
          setSelectedItems(allIds);
        } else {
          setSelectedItems(new Set());
        }
      } else {
        setCartItems([]);
        setTotalPrice(0);
        setSelectedItems(new Set());
      }
    } catch (error: any) {
      console.error("Error fetching cart:", error);

      if (
        error?.response?.status === 404 ||
        error?.message?.includes("not found")
      ) {
        setCartItems([]);
        setTotalPrice(0);
        setSelectedItems(new Set());
      } else {
        Alert.alert("Lỗi", "Không thể tải giỏ hàng");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchCart(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(cartItems.map((item) => item.id));
      setSelectedItems(allIds);
    }
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const handleUpdateQuantity = async (
    itemId: number,
    currentQuantity: number,
    change: number
  ) => {
    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập");
      return;
    }

    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await updateCartItem(userId, itemId, {
        quantity: newQuantity,
      });

      if (response?.data?.success) {
        await fetchCart(true);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập");
      return;
    }

    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await removeCartItem(userId, itemId);

              if (response?.data?.success) {
                setSelectedItems((prev) => {
                  const next = new Set(prev);
                  next.delete(itemId);
                  return next;
                });

                await fetchCart(true);

                Alert.alert("Thành công", "Đã xóa sản phẩm khỏi giỏ hàng");
              }
            } catch (error) {
              console.error("Error removing item:", error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm");
            }
          },
        },
      ]
    );
  };

  const handleRemoveSelected = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập");
      return;
    }

    if (selectedItems.size === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn sản phẩm để xóa");
      return;
    }

    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa ${selectedItems.size} sản phẩm đã chọn?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const deletePromises = Array.from(selectedItems).map((itemId) =>
                removeCartItem(userId, itemId)
              );

              await Promise.all(deletePromises);

              setSelectedItems(new Set());

              await fetchCart(true);

              Alert.alert("Thành công", "Đã xóa các sản phẩm đã chọn");
            } catch (error) {
              console.error("Error removing selected items:", error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm");
            }
          },
        },
      ]
    );
  };

  const handleClearCart = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập");
      return;
    }

    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await clearCart(userId);

            if (response?.data?.success) {
              setSelectedItems(new Set());
              setCartItems([]);
              setTotalPrice(0);
              await fetchCart(true);
              Alert.alert("Thành công", "Đã xóa toàn bộ giỏ hàng");
            }
          } catch (error) {
            console.error("Error clearing cart:", error);
            Alert.alert("Lỗi", "Không thể xóa giỏ hàng");
          }
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn sản phẩm để thanh toán");
      return;
    }

    const selectedProducts = cartItems.filter((item) =>
      selectedItems.has(item.id)
    );

    router.push({
      pathname: "/(screen)/CheckoutScreen",
      params: {
        items: JSON.stringify(selectedProducts),
        total: calculateSelectedTotal(),
      },
    });
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updatingItems.has(item.id);
    const isSelected = selectedItems.has(item.id);
    const productImage = getProductImage(item.productImage);

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleSelectItem(item.id)}
        >
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={24}
            color={isSelected ? "#047857" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => router.push(`/product/${item.productId}`)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="cover"
          />

          <View style={styles.itemDetails}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.productName}
            </Text>

            <Text style={styles.unitPrice}>{formatPrice(item.unitPrice)}</Text>

            <View style={styles.bottomRow}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    (isUpdating || item.quantity <= 1) &&
                      styles.quantityButtonDisabled,
                  ]}
                  onPress={() =>
                    handleUpdateQuantity(item.id, item.quantity, -1)
                  }
                  disabled={isUpdating || item.quantity <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={
                      item.quantity <= 1 || isUpdating ? "#D1D5DB" : "#374151"
                    }
                  />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#047857" />
                  ) : (
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    isUpdating && styles.quantityButtonDisabled,
                  ]}
                  onPress={() =>
                    handleUpdateQuantity(item.id, item.quantity, 1)
                  }
                  disabled={isUpdating}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={isUpdating ? "#D1D5DB" : "#374151"}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.lineTotal}>
                {formatPrice(item.lineTotal)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Giỏ hàng {cartItems.length > 0 && `(${cartItems.length})`}
        </Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearAllText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptyText}>
            Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Ionicons name="storefront-outline" size={20} color="#FFF" />
            <Text style={styles.shopButtonText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Ionicons
                name={
                  selectedItems.size === cartItems.length
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={
                  selectedItems.size === cartItems.length
                    ? "#047857"
                    : "#9CA3AF"
                }
              />
              <Text style={styles.selectAllText}>
                Chọn tất cả ({cartItems.length})
              </Text>
            </TouchableOpacity>

            {selectedItems.size > 0 && (
              <TouchableOpacity
                style={styles.removeSelectedButton}
                onPress={handleRemoveSelected}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.removeSelectedText}>
                  Xóa ({selectedItems.size})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#047857"]}
                tintColor="#047857"
              />
            }
          />

          <View style={styles.footer}>
            <View style={styles.footerTop}>
              <View style={styles.selectedInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#047857" />
                <Text style={styles.selectedText}>
                  Đã chọn {selectedItems.size} sản phẩm
                </Text>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalPrice}>
                  {formatPrice(calculateSelectedTotal())}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                selectedItems.size === 0 && styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              <Text style={styles.checkoutButtonText}>
                Thanh toán ({selectedItems.size})
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  clearAllText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  shopButton: {
    flexDirection: "row",
    backgroundColor: "#047857",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  selectAllContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  removeSelectedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  removeSelectedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "flex-start",
  },
  checkbox: {
    paddingTop: 4,
    paddingRight: 8,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    lineHeight: 18,
  },
  unitPrice: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 2,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#BE123C",
  },
  removeButton: {
    padding: 8,
    marginLeft: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  footerTop: {
    marginBottom: 12,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 13,
    color: "#047857",
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  totalPrice: {
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
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
