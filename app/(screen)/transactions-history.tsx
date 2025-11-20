import { getListTransactionsByUser } from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

interface Transaction {
  orderCode: string;
  amount: number;
  status: string;
  checkoutUrl: string;
  paymentLinkId: string;
}

type TransactionStatus = "ALL" | "PENDING" | "PAID" | "CANCELLED";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
  PAID: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

const TransactionsHistory = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<TransactionStatus>("ALL");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [currentTransactionCode, setCurrentTransactionCode] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [selectedStatus, transactions]);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getListTransactionsByUser();
      if (response?.data) {
        const sortedTransactions = [...response.data].sort(
          (a, b) => parseInt(b.orderCode) - parseInt(a.orderCode)
        );
        setTransactions(sortedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTransactions = () => {
    if (selectedStatus === "ALL") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(
        transactions.filter(
          (transaction) => transaction.status === selectedStatus
        )
      );
    }
  };

  const onRefresh = useCallback(() => {
    fetchTransactions(true);
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

  const handlePaymentPress = (checkoutUrl: string, orderCode: string) => {
    setPaymentUrl(checkoutUrl);
    setCurrentTransactionCode(orderCode);
    setShowPaymentModal(true);
    setWebViewLoading(true);
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
          setCurrentTransactionCode("");
          setWebViewLoading(true);
        },
      },
    ]);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (
      url.includes("/success") ||
      url.includes("success=true") ||
      url.includes("status=PAID")
    ) {
      setShowPaymentModal(false);
      setPaymentUrl("");
      setWebViewLoading(true);

      Alert.alert("Thành công", "Thanh toán thành công!", [
        {
          text: "Xem đơn hàng",
          onPress: () => {
            fetchTransactions(true);
            router.push({
              pathname: "/(screen)/OrderDetailScreen",
              params: {
                orderCode: currentTransactionCode,
              },
            });
          },
        },
        {
          text: "OK",
          onPress: () => {
            fetchTransactions(true);
          },
        },
      ]);
    }
    // Check for cancel/failure URL patterns
    else if (
      url.includes("/cancel") ||
      url.includes("cancel=true") ||
      url.includes("status=CANCELLED")
    ) {
      setShowPaymentModal(false);
      setPaymentUrl("");
      setWebViewLoading(true);

      Alert.alert("Đã hủy", "Bạn đã hủy thanh toán", [
        {
          text: "OK",
          onPress: () => {
            fetchTransactions(true);
          },
        },
      ]);
    }
  };

  const handleOrderPress = (orderCode: string) => {
    router.push({
      pathname: "/(screen)/OrderDetailScreen",
      params: {
        orderCode: orderCode,
      },
    });
  };

  const renderFilterTabs = () => {
    const statuses: {
      key: TransactionStatus;
      label: string;
      count?: number;
    }[] = [
      { key: "ALL", label: "Tất cả", count: transactions.length },
      {
        key: "PENDING",
        label: "Chờ TT",
        count: transactions.filter((t) => t.status === "PENDING").length,
      },
      {
        key: "PAID",
        label: "Đã TT",
        count: transactions.filter((t) => t.status === "PAID").length,
      },
      {
        key: "CANCELLED",
        label: "Đã hủy",
        count: transactions.filter((t) => t.status === "CANCELLED").length,
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

  const renderTransactionCard = ({
    item: transaction,
  }: {
    item: Transaction;
  }) => {
    const statusStyle = getStatusStyle(transaction.status);
    const timeAgo = getTimeAgo(transaction.orderCode);

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleOrderPress(transaction.orderCode)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: statusStyle.bg },
              ]}
            >
              <Ionicons
                name={statusStyle.icon as any}
                size={24}
                color={statusStyle.text}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.orderCode}>#{transaction.orderCode}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
            <Text style={styles.infoText}>
              {formatDate(transaction.orderCode)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" />
            <Text style={styles.infoText}>
              Mã thanh toán: {transaction.paymentLinkId.substring(0, 16)}...
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Số tiền:</Text>
            <Text style={styles.amountValue}>
              {formatVND(transaction.amount)}
            </Text>
          </View>

          {transaction.status === "PENDING" && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() =>
                handlePaymentPress(
                  transaction.checkoutUrl,
                  transaction.orderCode
                )
              }
            >
              <Ionicons name="card-outline" size={16} color="#FFF" />
              <Text style={styles.payButtonText}>Thanh toán</Text>
            </TouchableOpacity>
          )}

          {transaction.status !== "PENDING" && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => handleOrderPress(transaction.orderCode)}
            >
              <Text style={styles.detailButtonText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#047857" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedStatus === "ALL"
          ? "Chưa có giao dịch nào"
          : `Không có giao dịch ${getStatusLabel(
              selectedStatus
            ).toLowerCase()}`}
      </Text>
      <Text style={styles.emptyText}>
        {selectedStatus === "ALL"
          ? "Lịch sử giao dịch của bạn sẽ hiển thị tại đây"
          : "Thử chọn trạng thái khác để xem giao dịch"}
      </Text>
    </View>
  );

  const renderStats = () => {
    const totalAmount = filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const pendingCount = transactions.filter(
      (t) => t.status === "PENDING"
    ).length;
    const paidCount = transactions.filter((t) => t.status === "PAID").length;

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardLarge]}>
          <View style={styles.statCardHeader}>
            <Ionicons name="wallet-outline" size={28} color="#047857" />
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>
                {selectedStatus === "ALL"
                  ? "Tổng"
                  : getStatusLabel(selectedStatus)}
              </Text>
            </View>
          </View>
          <Text style={styles.statAmount}>{formatVND(totalAmount)}</Text>
          <Text style={styles.statLabel}>
            {filteredTransactions.length} giao dịch
          </Text>
        </View>

        <View style={styles.statColumn}>
          <View style={styles.statCardSmall}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.statNumberSmall}>{pendingCount}</Text>
            <Text style={styles.statLabelSmall}>Chờ thanh toán</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statNumberSmall}>{paidCount}</Text>
            <Text style={styles.statLabelSmall}>Đã thanh toán</Text>
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
          <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
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
          Lịch sử giao dịch{" "}
          {transactions.length > 0 && `(${transactions.length})`}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => fetchTransactions(true)}
        >
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.paymentLinkId}
        renderItem={renderTransactionCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredTransactions.length > 0 ? renderStats : null
        }
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

      {/* Payment WebView Modal */}
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
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#047857",
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
  transactionCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountContainer: {
    gap: 4,
  },
  amountLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
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

export default TransactionsHistory;
