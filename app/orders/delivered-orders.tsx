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

const OrderDelivered = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

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

      if (response?.data) {
        // Filter only delivered orders
        const deliveredOrders = response.data.filter(
          (order: Order) => order.status === "DELIVERED"
        );
        setOrders(deliveredOrders);

        // Calculate total revenue
        const revenue = deliveredOrders.reduce(
          (sum: number, order: Order) => sum + order.total,
          0
        );
        setTotalRevenue(revenue);
      } else {
        setOrders([]);
        setTotalRevenue(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotalRevenue(0);
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

  const getTimeAgo = (orderCode: string) => {
    try {
      const timestamp = parseInt(orderCode) * 1000;
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Hôm nay";
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 7) return `${diffDays} ngày trước`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
      return `${Math.floor(diffDays / 30)} tháng trước`;
    } catch (error) {
      return "";
    }
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
    const itemCount = order.items.length;
    const timeAgo = getTimeAgo(order.orderCode);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.orderCode}>#{order.orderCode}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-done" size={14} color="#047857" />
            <Text style={styles.statusText}>Đã giao</Text>
          </View>
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

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Giao lúc:</Text>
            <Text style={styles.infoValue}>{formatDate(order.orderCode)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Doanh thu:</Text>
            <Text style={styles.totalAmount}>{formatVND(order.total)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="repeat-outline" size={18} color="#047857" />
              <Text style={styles.actionButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailButton}>
              <Text style={styles.detailButtonText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#047857" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="checkmark-done-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có đơn hàng đã giao</Text>
      <Text style={styles.emptyText}>
        Các đơn hàng đã giao thành công sẽ được hiển thị tại đây
      </Text>
    </View>
  );

  const renderStats = () => {
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, order) => sum + order.items.length,
      0
    );

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardLarge]}>
          <View style={styles.statCardHeader}>
            <Ionicons name="trending-up" size={28} color="#10B981" />
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.statBadgeText}>Hoàn thành</Text>
            </View>
          </View>
          <Text style={styles.statRevenue}>{formatVND(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Tổng doanh thu</Text>
        </View>

        <View style={styles.statColumn}>
          <View style={styles.statCardSmall}>
            <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
            <Text style={styles.statNumberSmall}>{totalOrders}</Text>
            <Text style={styles.statLabelSmall}>Đơn hàng</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Ionicons name="cube-outline" size={20} color="#F59E0B" />
            <Text style={styles.statNumberSmall}>{totalItems}</Text>
            <Text style={styles.statLabelSmall}>Sản phẩm</Text>
          </View>
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
          <Text style={styles.headerTitle}>Đơn đã giao</Text>
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
          Đơn đã giao {orders.length > 0 && `(${orders.length})`}
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
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardLarge: {
    flex: 1,
    gap: 8,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  statRevenue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statColumn: {
    gap: 12,
  },
  statCardSmall: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumberSmall: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statLabelSmall: {
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
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  orderCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  timeAgo: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
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
    gap: 12,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#047857",
    backgroundColor: "#FFF",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#047857",
  },
  detailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
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

export default OrderDelivered;
