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

interface Order {
  orderCode: string;
  status: string;
  total: number;
  items: OrderItem[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  transactions?: any[];
}

// Orders in processing states: UNPAID, PAID, SHIPPING
const PROCESSING_STATUSES = ["UNPAID", "PAID", "SHIPPING"];

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  UNPAID: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
  PAID: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
  SHIPPING: { bg: "#DBEAFE", text: "#1E40AF", icon: "car-outline" },
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  SHIPPING: "Đang giao hàng",
};

const OrderProcessing = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getOrders();
      console.log("Orders fetched:", response.data);

      if (response?.data) {
        // Filter only processing orders
        const processingOrders = response.data.filter((order: Order) =>
          PROCESSING_STATUSES.includes(order.status)
        );
        setOrders(processingOrders);
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

  const getStatusProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      UNPAID: 33,
      PAID: 66,
      SHIPPING: 100,
    };
    return progressMap[status] || 0;
  };

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: "/(screen)/OrderDetailScreen",
      params: {
        orderCode: order.orderCode,
      },
    });
  };

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const statusStyle = getStatusStyle(order.status);
    const itemCount = order.items.length;
    const progress = getStatusProgress(order.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
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
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDate}>
          <Ionicons name="time-outline" size={16} color="#9CA3AF" />
          <Text style={styles.orderDateText}>
            {formatDate(order.orderCode)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {order.status === "UNPAID" && "Bước 1/3: Chờ thanh toán"}
            {order.status === "PAID" && "Bước 2/3: Đang chuẩn bị"}
            {order.status === "SHIPPING" && "Bước 3/3: Đang giao hàng"}
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
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalAmount}>{formatVND(order.total)}</Text>
          </View>

          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#047857" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="hourglass-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Không có đơn hàng đang xử lý</Text>
      <Text style={styles.emptyText}>
        Các đơn hàng đang chờ thanh toán, chuẩn bị và giao hàng sẽ hiển thị tại
        đây
      </Text>
    </View>
  );

  const renderStats = () => {
    const unpaidCount = orders.filter((o) => o.status === "UNPAID").length;
    const paidCount = orders.filter((o) => o.status === "PAID").length;
    const shippingCount = orders.filter((o) => o.status === "SHIPPING").length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{unpaidCount}</Text>
          <Text style={styles.statLabel}>Chờ thanh toán</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{paidCount}</Text>
          <Text style={styles.statLabel}>Đang chuẩn bị</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="car-outline" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{shippingCount}</Text>
          <Text style={styles.statLabel}>Đang giao</Text>
        </View>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Đơn đang xử lý</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
          Đơn đang xử lý {orders.length > 0 && `(${orders.length})`}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => fetchOrders(true)}
        >
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderCode}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={orders.length > 0 ? renderStats : null}
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
  listContainer: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
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
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#047857",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "600",
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
});

export default OrderProcessing;
