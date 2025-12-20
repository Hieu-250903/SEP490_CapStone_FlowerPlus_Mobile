import { getListTransactionsByUser } from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type TransactionStatus = "ALL" | "PENDING" | "SUCCESS" | "CANCELLED";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
  SUCCESS: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  SUCCESS: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

const TransactionsHistory = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [currentTransactionCode, setCurrentTransactionCode] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [selectedStatus, searchQuery, transactions]);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getListTransactionsByUser();
      console.log(response.data);
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
      Alert.alert("Lỗi", "Không thể tải danh sách giao dịch");
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((transaction) =>
        transaction.orderCode.toLowerCase().includes(query) ||
        transaction.paymentLinkId.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(
        (transaction) => transaction.status === selectedStatus
      );
    }

    setFilteredTransactions(filtered);
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
    // Map any status other than PENDING or SUCCESS to CANCELLED
    const normalizedStatus = status === "PENDING" || status === "SUCCESS" ? status : "CANCELLED";
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.CANCELLED;
  };

  const getStatusLabel = (status: string) => {
    // Map any status other than PENDING or SUCCESS to CANCELLED
    const normalizedStatus = status === "PENDING" || status === "SUCCESS" ? status : "CANCELLED";
    return STATUS_LABELS[normalizedStatus] || "Đã hủy";
  };

  const handlePaymentPress = (checkoutUrl: string, orderCode: string) => {
    setPaymentUrl(checkoutUrl);
    setCurrentTransactionCode(orderCode);
    setShowPaymentModal(true);
    setWebViewLoading(true);
  };

  const handleClosePaymentModal = () => {
    Alert.alert("Xác nhận", "Bạn có muốn hủy thanh toán?", [
      { text: "Tiếp tục thanh toán", style: "cancel" },
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
          text: "OK",
          onPress: () => {
            fetchTransactions(true);
          },
        },
      ]);
    } else if (
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
          key: "SUCCESS",
          label: "Đã TT",
          count: transactions.filter((t) => t.status === "SUCCESS").length,
        },
        {
          key: "CANCELLED",
          label: "Đã hủy",
          count: transactions.filter((t) => t.status !== "PENDING" && t.status !== "SUCCESS").length,
        },
      ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {statuses.map((item) => (
            <TouchableOpacity
              key={item.key}
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
          ))}
        </ScrollView>
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
      <View style={styles.transactionCard}>
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
            <Text style={styles.infoText} numberOfLines={1}>
              Mã TT: {transaction.paymentLinkId.substring(0, 20)}...
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
        {selectedStatus === "ALL" || searchQuery
          ? "Không tìm thấy giao dịch"
          : `Không có giao dịch ${getStatusLabel(
            selectedStatus
          ).toLowerCase()}`}
      </Text>
      <Text style={styles.emptyText}>
        {selectedStatus === "ALL" && !searchQuery
          ? "Lịch sử giao dịch của bạn sẽ hiển thị tại đây"
          : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
      </Text>
      {(searchQuery || selectedStatus !== "ALL") && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => {
            setSearchQuery("");
            setSelectedStatus("ALL");
          }}
        >
          <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      )}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã giao dịch..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.resultCount}>
          Tìm thấy{" "}
          <Text style={styles.resultCountBold}>
            {filteredTransactions.length}
          </Text>{" "}
          giao dịch
        </Text>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.paymentLinkId}
        renderItem={renderTransactionCard}
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
  searchContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  resultCount: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  resultCountBold: {
    fontWeight: "600",
    color: "#047857",
  },
  filterContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterScrollContent: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#047857",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  clearFilterButton: {
    marginTop: 16,
    backgroundColor: "#047857",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
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
  webViewLoadingContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  webViewLoadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  webView: {
    flex: 1,
  },
});

export default TransactionsHistory;
