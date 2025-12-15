import { getOrders } from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DeliveryStatus {
  id: number;
  step: string;
  note: string;
  createdAt: string;
}

interface Transaction {
  status: string;
  amount: number;
}

interface Order {
  orderCode: string;
  total: number;
  discountAmount: number;
  items: OrderItem[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  deliveryStatuses: DeliveryStatus[];
  transaction: Transaction;
}

const getCurrentStep = (order: Order): string => {
  if (order.deliveryStatuses && order.deliveryStatuses.length > 0) {
    return order.deliveryStatuses[order.deliveryStatuses.length - 1].step;
  }
  return order.transaction?.status === "PENDING" ? "PENDING_CONFIRMATION" : "PENDING_CONFIRMATION";
};

type DeliveryStep =
  | "ALL"
  | "PENDING_CONFIRMATION"
  | "PREPARING"
  | "DELIVERING"
  | "DELIVERED"
  | "DELIVERY_FAILED";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  PENDING_CONFIRMATION: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
  PREPARING: { bg: "#DBEAFE", text: "#1E40AF", icon: "cube-outline" },
  DELIVERING: { bg: "#E0E7FF", text: "#4338CA", icon: "car-outline" },
  DELIVERED: { bg: "#D1FAE5", text: "#047857", icon: "checkmark-done" },
  DELIVERY_FAILED: { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  DELIVERING: "Đang giao",
  DELIVERED: "Đã giao",
  DELIVERY_FAILED: "Giao thất bại",
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
  SUCCESS: { bg: "#D1FAE5", text: "#047857", icon: "checkmark-circle" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" },
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  SUCCESS: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

const AllOrder = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStep>("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedStatus, orders]);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getOrders();

      if (response?.data) {
        console.log("Orders fetched successfully:", response.data);
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    if (selectedStatus === "ALL") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter((order) => getCurrentStep(order) === selectedStatus)
      );
    }
  };

  const onRefresh = useCallback(() => {
    fetchOrders(true);
  }, []);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (orderCode: string) => {
    try {
      const timestamp = parseInt(orderCode) * 1000;
      const date = new Date(timestamp);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return orderCode;
    }
  };

  const getStatusStyle = (status: string) => {
    return (
      STATUS_COLORS[status] || {
        bg: "#F3F4F6",
        text: "#6B7280",
        icon: "help-circle",
      }
    );
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status] || status;
  };

  const renderStatusFilter = () => {
    const statuses: { key: DeliveryStep; label: string; count?: number }[] = [
      { key: "ALL", label: "Tất cả", count: orders.length },
      {
        key: "PENDING_CONFIRMATION",
        label: "Chờ XN",
        count: orders.filter((o) => getCurrentStep(o) === "PENDING_CONFIRMATION").length,
      },
      {
        key: "PREPARING",
        label: "Chuẩn bị",
        count: orders.filter((o) => getCurrentStep(o) === "PREPARING").length,
      },
      {
        key: "DELIVERING",
        label: "Đang giao",
        count: orders.filter((o) => getCurrentStep(o) === "DELIVERING").length,
      },
      {
        key: "DELIVERED",
        label: "Hoàn thành",
        count: orders.filter((o) => getCurrentStep(o) === "DELIVERED").length,
      },
    ];

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statuses}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
              {item.count !== undefined && item.count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    selectedStatus === item.key && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      selectedStatus === item.key &&
                      styles.filterBadgeTextActive,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const currentStep = getCurrentStep(order);
    const statusStyle = getStatusStyle(currentStep);
    const itemCount = order.items.length;

    return (
      <View
        style={styles.orderCard}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Ionicons name="receipt-outline" size={20} color="#6B7280" />
            <Text style={styles.orderCode}>#{order.orderCode}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Ionicons
              name={statusStyle.icon as any}
              size={14}
              color={statusStyle.text}
            />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getStatusLabel(currentStep)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDate}>
          <Ionicons name="time-outline" size={16} color="#9CA3AF" />
          <Text style={styles.orderDateText}>
            {formatDate(order.orderCode)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Khách hàng:</Text>
            <Text style={styles.infoValue}>
              {order.user.firstName} {order.user.lastName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Số lượng:</Text>
            <Text style={styles.infoValue}>{itemCount} sản phẩm</Text>
          </View>

          {order.transaction && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color="#6B7280" />
              <Text style={styles.infoLabel}>Thanh toán:</Text>
              <View style={[
                styles.paymentBadge,
                { backgroundColor: (PAYMENT_STATUS_COLORS[order.transaction.status] || PAYMENT_STATUS_COLORS.PENDING).bg }
              ]}>
                <Text style={[
                  styles.paymentBadgeText,
                  { color: (PAYMENT_STATUS_COLORS[order.transaction.status] || PAYMENT_STATUS_COLORS.PENDING).text }
                ]}>
                  {PAYMENT_STATUS_LABELS[order.transaction.status] || order.transaction.status}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          {order.discountAmount > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng tiền:</Text>
              <Text style={styles.discountAmount}>{formatVND(order.discountAmount)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedStatus === "ALL"
          ? "Chưa có đơn hàng nào"
          : `Không có đơn hàng ${getStatusLabel(selectedStatus).toLowerCase()}`}
      </Text>
      <Text style={styles.emptyText}>
        {selectedStatus === "ALL"
          ? "Các đơn hàng của bạn sẽ hiển thị tại đây"
          : "Thử chọn trạng thái khác để xem đơn hàng"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tất cả đơn hàng</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Tất cả đơn hàng {orders.length > 0 && `(${orders.length})`}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => fetchOrders(true)}
        >
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {renderStatusFilter()}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderCode}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#047857"]}
            tintColor="#047857"
          />
        }
      />
    </SafeAreaView>
  );
};

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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
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
  filterContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#047857",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFF",
  },
  filterBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  filterBadgeTextActive: {
    color: "#FFF",
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  orderDateText: {
    fontSize: 13,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalContainer: {
    gap: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#047857",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#047857",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AllOrder;
