import { cancelOrder, getOrders, type Order } from "@/services/order";
import { getProductDetail } from "@/services/product";
import { forceHttps } from "@/utils/imageUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DeliveryStep = 'PENDING_CONFIRMATION' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'DELIVERY_FAILED' | 'CANCELLED';
type StatusFilter = 'ALL' | DeliveryStep;

interface StatusConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const deliveryStepOrder: DeliveryStep[] = [
  'PENDING_CONFIRMATION',
  'PREPARING',
  'DELIVERING',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED'
];

const STATUS_CONFIGS: Record<DeliveryStep, StatusConfig> = {
  PENDING_CONFIRMATION: {
    label: 'Chờ xác nhận',
    icon: 'time-outline',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#FCD34D',
  },
  PREPARING: {
    label: 'Đang chuẩn bị',
    icon: 'cube-outline',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderColor: '#93C5FD',
  },
  DELIVERING: {
    label: 'Đang giao hàng',
    icon: 'car-outline',
    bgColor: '#E9D5FF',
    textColor: '#6B21A8',
    borderColor: '#C084FC',
  },
  DELIVERED: {
    label: 'Giao thành công',
    icon: 'checkmark-circle',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    borderColor: '#6EE7B7',
  },
  DELIVERY_FAILED: {
    label: 'Giao thất bại',
    icon: 'close-circle',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: 'ban-outline',
    bgColor: '#F3F4F6',
    textColor: '#6B7280',
    borderColor: '#D1D5DB',
  },
};

const OrdersHistory = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Cancel order states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<{ id: number; code: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const itemsPerPage = 5;

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
        const sortedOrders = [...response.data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentDeliveryStatus = (deliveryStatuses: any[]): DeliveryStep => {
    if (!deliveryStatuses || deliveryStatuses.length === 0) {
      return 'PENDING_CONFIRMATION';
    }

    let maxStep: DeliveryStep = 'PENDING_CONFIRMATION';
    let maxIndex = 0;

    deliveryStatuses.forEach((status) => {
      const currentIndex = deliveryStepOrder.indexOf(status.step as DeliveryStep);
      if (currentIndex > maxIndex) {
        maxIndex = currentIndex;
        maxStep = status.step as DeliveryStep;
      }
    });

    return maxStep;
  };

  const generateTimeline = (deliveryStatuses: any[], currentStatus: DeliveryStep) => {
    if (!deliveryStatuses || deliveryStatuses.length === 0) {
      return [{
        step: 'PENDING_CONFIRMATION',
        isCurrent: true,
        isCompleted: false,
        hasData: false,
        data: null
      }];
    }

    const currentIndex = deliveryStepOrder.indexOf(currentStatus);
    const timeline = [];

    for (let i = 0; i <= currentIndex; i++) {
      const step = deliveryStepOrder[i];
      const statusData = deliveryStatuses.find((s) => s.step === step);

      timeline.push({
        step,
        isCurrent: step === currentStatus,
        isCompleted: i < currentIndex,
        hasData: !!statusData,
        data: statusData || null
      });
    }

    return timeline.reverse();
  };

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const matchOrderCode = order.orderCode.toLowerCase().includes(query);
        const matchProductName = order.items?.some((item: any) =>
          item.productName.toLowerCase().includes(query)
        );
        return matchOrderCode || matchProductName;
      });
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((order) => {
        const currentStatus = getCurrentDeliveryStatus(order.deliveryStatuses);
        return currentStatus === statusFilter;
      });
    }

    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleProductClick = async (productId: number) => {
    try {
      setIsLoadingProduct(true);
      setShowProductModal(true);
      const response = await getProductDetail(productId);
      if (response?.data) {
        setSelectedProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      setShowProductModal(false);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleCancelOrder = (orderId: number, orderCode: string) => {
    setOrderToCancel({ id: orderId, code: orderCode });
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleSubmitCancel = async () => {
    if (!orderToCancel) return;
    if (!cancelReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    setIsCancelling(true);
    try {
      await cancelOrder(orderToCancel.id, cancelReason.trim());
      Alert.alert(
        'Thành công',
        'Đơn hàng đã được hủy. Yêu cầu hoàn tiền sẽ được tạo tự động.'
      );
      setShowCancelModal(false);
      setCancelReason('');
      setOrderToCancel(null);
      fetchOrders(true);
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const renderFilterTabs = () => {
    const statuses: { key: StatusFilter; label: string; count: number }[] = [
      { key: 'ALL', label: 'Tất cả', count: orders.length },
      {
        key: 'PENDING_CONFIRMATION',
        label: 'Chờ XN',
        count: orders.filter((o) => getCurrentDeliveryStatus(o.deliveryStatuses) === 'PENDING_CONFIRMATION').length,
      },
      {
        key: 'PREPARING',
        label: 'Chuẩn bị',
        count: orders.filter((o) => getCurrentDeliveryStatus(o.deliveryStatuses) === 'PREPARING').length,
      },
      {
        key: 'DELIVERING',
        label: 'Đang giao',
        count: orders.filter((o) => getCurrentDeliveryStatus(o.deliveryStatuses) === 'DELIVERING').length,
      },
      {
        key: 'DELIVERED',
        label: 'Hoàn thành',
        count: orders.filter((o) => getCurrentDeliveryStatus(o.deliveryStatuses) === 'DELIVERED').length,
      },
      {
        key: 'CANCELLED',
        label: 'Đã hủy',
        count: orders.filter((o) => getCurrentDeliveryStatus(o.deliveryStatuses) === 'CANCELLED').length,
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
                statusFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => {
                setStatusFilter(item.key);
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
              {item.count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    statusFilter === item.key && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      statusFilter === item.key && styles.filterBadgeTextActive,
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

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const isExpanded = expandedOrder === order.orderCode;
    const currentStatus = getCurrentDeliveryStatus(order.deliveryStatuses);
    const statusConfig = STATUS_CONFIGS[currentStatus];
    const timeline = generateTimeline(order.deliveryStatuses, currentStatus);
    const StatusIcon = Ionicons;

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={[styles.orderHeader, { backgroundColor: statusConfig.bgColor + '40' }]}
          onPress={() => setExpandedOrder(isExpanded ? null : order.orderCode)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderContent}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderCode}>Đơn #{order.orderCode}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor
              }]}>
                <StatusIcon name={statusConfig.icon} size={14} color={statusConfig.textColor} />
                <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#047857"
            />
          </View>
          <View style={styles.orderSummary}>
            <Text style={styles.orderTotal}>{formatVND(order.total)}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.orderDetails}>
            {/* Recipient Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color="#047857" />
                <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
              </View>
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{order.recipientName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{order.phoneNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{order.shippingAddress}</Text>
                </View>
                {order.note && (
                  <View style={[styles.infoRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                    <Ionicons name="chatbox-outline" size={16} color="#6B7280" />
                    <Text style={[styles.infoText, { fontStyle: 'italic' }]}>"{order.note}"</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Delivery Timeline */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="car-outline" size={18} color="#047857" />
                <Text style={styles.sectionTitle}>Trạng thái giao hàng</Text>
              </View>
              <View style={styles.timeline}>
                {timeline.map((item, index) => {
                  const config = STATUS_CONFIGS[item.step as DeliveryStep];
                  const TimelineIcon = Ionicons;

                  return (
                    <View key={item.step} style={styles.timelineItem}>
                      <View style={[
                        styles.timelineIconContainer,
                        { backgroundColor: item.hasData ? config.bgColor : '#F3F4F6' }
                      ]}>
                        <TimelineIcon
                          name={config.icon}
                          size={20}
                          color={item.hasData ? config.textColor : '#9CA3AF'}
                        />
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={[
                            styles.timelineLabel,
                            { color: item.hasData ? config.textColor : '#9CA3AF' }
                          ]}>
                            {config.label}
                          </Text>
                          {item.isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Hiện tại</Text>
                            </View>
                          )}
                          {item.isCompleted && (
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          )}
                        </View>
                        {item.data ? (
                          <View style={styles.timelineDetails}>
                            <Text style={styles.timelineTime}>
                              {formatDate(item.data.eventAt)}
                            </Text>
                            {item.data.location && (
                              <Text style={styles.timelineLocation}>📍 {item.data.location}</Text>
                            )}
                            {item.data.imageUrl && (
                              <TouchableOpacity
                                style={styles.timelineImage}
                                onPress={() => setZoomedImage(item.data.imageUrl)}
                              >
                                <Image
                                  source={{ uri: forceHttps(item.data.imageUrl) }}
                                  style={styles.timelineImageThumb}
                                  resizeMode="cover"
                                />
                                <View style={styles.imageOverlay}>
                                  <Ionicons name="expand-outline" size={16} color="#FFF" />
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.timelinePending}>Chưa cập nhật</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube-outline" size={18} color="#047857" />
                <Text style={styles.sectionTitle}>Sản phẩm</Text>
              </View>
              <View style={styles.productsList}>
                {order.items?.map((item: any) => {
                  let images: string[] = [];
                  try {
                    images = JSON.parse(item.productImage || '[]');
                  } catch (e) {
                    images = [];
                  }
                  const mainImage = images[0];

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.productItem}
                      onPress={() => handleProductClick(item.productId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.productImage}>
                        {mainImage ? (
                          <Image
                            source={{ uri: forceHttps(mainImage) }}
                            style={styles.productImageThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <View style={styles.productNameRow}>
                          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                          <View style={styles.viewDetailBadge}>
                            <Ionicons name="eye-outline" size={12} color="#047857" />
                            <Text style={styles.viewDetailText}>Chi tiết</Text>
                          </View>
                        </View>
                        <View style={styles.productMeta}>
                          <Text style={styles.productQuantity}>SL: {item.quantity}</Text>
                          <Text style={styles.productDot}>•</Text>
                          <Text style={styles.productPrice}>{formatVND(item.unitPrice)}</Text>
                        </View>
                      </View>
                      <View style={styles.productTotal}>
                        <Text style={styles.productTotalLabel}>Thành tiền</Text>
                        <Text style={styles.productTotalPrice}>{formatVND(item.lineTotal)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Order Total & Actions */}
            <View style={styles.orderFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalAmount}>{formatVND(order.total)}</Text>
              </View>

              {currentStatus === 'PREPARING' && !order.cancelled && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelOrder(order.id, order.orderCode)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || statusFilter !== 'ALL'
          ? 'Không tìm thấy đơn hàng'
          : 'Chưa có đơn hàng'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || statusFilter !== 'ALL'
          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
          : 'Đơn hàng của bạn sẽ hiển thị tại đây'}
      </Text>
      {(searchQuery || statusFilter !== 'ALL') && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => {
            setSearchQuery('');
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
        >
          <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Đơn hàng {orders.length > 0 && `(${orders.length})`}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => fetchOrders(true)}>
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.resultCount}>
          Tìm thấy <Text style={styles.resultCountBold}>{filteredOrders.length}</Text> đơn hàng
        </Text>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={paginatedOrders}
        keyExtractor={(item) => item.orderCode}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            colors={['#047857']}
            tintColor="#047857"
          />
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#D1D5DB' : '#047857'} />
          </TouchableOpacity>

          <Text style={styles.paginationText}>
            Trang {currentPage} / {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#D1D5DB' : '#047857'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.productModalContainer}>
          <View style={styles.productModalContent}>
            {/* Header */}
            <View style={styles.productModalHeader}>
              <Text style={styles.productModalTitle}>Chi tiết sản phẩm</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                }}
                style={styles.productModalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {isLoadingProduct ? (
              <View style={styles.productModalLoading}>
                <ActivityIndicator size="large" color="#047857" />
                <Text style={styles.productModalLoadingText}>Đang tải...</Text>
              </View>
            ) : selectedProduct ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Product Image */}
                {(() => {
                  let images: string[] = [];
                  try {
                    images = JSON.parse(selectedProduct.images || '[]');
                  } catch (e) {
                    images = [];
                  }
                  const mainImage = images[0];
                  return mainImage ? (
                    <TouchableOpacity onPress={() => setZoomedImage(mainImage)}>
                      <Image
                        source={{ uri: forceHttps(mainImage) }}
                        style={styles.productModalImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.productModalImagePlaceholder}>
                      <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                    </View>
                  );
                })()}

                {/* Product Name & Price */}
                <View style={styles.productModalBasicInfo}>
                  <Text style={styles.productModalName}>{selectedProduct.name}</Text>
                  <Text style={styles.productModalPrice}>{formatVND(selectedProduct.price)}</Text>
                </View>

                {/* Product Info Grid */}
                <View style={styles.productModalInfoGrid}>
                  <View style={styles.productModalInfoItem}>
                    <Text style={styles.productModalInfoLabel}>Danh mục</Text>
                    <Text style={styles.productModalInfoValue}>
                      {selectedProduct.categories?.[0]?.name || 'Chưa phân loại'}
                    </Text>
                  </View>
                  <View style={styles.productModalInfoItem}>
                    <Text style={styles.productModalInfoLabel}>Trạng thái</Text>
                    <Text style={styles.productModalInfoValue}>
                      {selectedProduct.isActive ? 'Đang bán' : 'Ngừng bán'}
                    </Text>
                  </View>
                  <View style={styles.productModalInfoItem}>
                    <Text style={styles.productModalInfoLabel}>Tồn kho</Text>
                    <Text style={styles.productModalInfoValue}>
                      {selectedProduct.stock || 0} sản phẩm
                    </Text>
                  </View>
                  <View style={styles.productModalInfoItem}>
                    <Text style={styles.productModalInfoLabel}>Mã SP</Text>
                    <Text style={styles.productModalInfoValue}>#{selectedProduct.id}</Text>
                  </View>
                </View>

                {/* Description */}
                {selectedProduct.description && (
                  <View style={styles.productModalSection}>
                    <Text style={styles.productModalSectionTitle}>Mô tả</Text>
                    <Text style={styles.productModalDescription}>
                      {selectedProduct.description}
                    </Text>
                  </View>
                )}

                {/* Compositions */}
                {selectedProduct.compositions && selectedProduct.compositions.length > 0 && (
                  <View style={styles.productModalSection}>
                    <View style={styles.productModalSectionHeader}>
                      <Ionicons name="flower-outline" size={18} color="#EC4899" />
                      <Text style={styles.productModalSectionTitle}>Thành phần cấu tạo</Text>
                    </View>
                    {selectedProduct.compositions.map((comp: any, index: number) => {
                      let compImages: string[] = [];
                      try {
                        compImages = JSON.parse(comp.childImage || '[]');
                      } catch (e) {
                        compImages = [];
                      }
                      const compImage = compImages[0];
                      const isFlower = comp.childType === 'FLOWER';

                      return (
                        <View key={index} style={styles.compositionItem}>
                          <View style={styles.compositionImageContainer}>
                            {compImage ? (
                              <Image
                                source={{ uri: forceHttps(compImage) }}
                                style={styles.compositionImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons
                                name={isFlower ? 'flower-outline' : 'cube-outline'}
                                size={20}
                                color={isFlower ? '#EC4899' : '#6B7280'}
                              />
                            )}
                          </View>
                          <View style={styles.compositionInfo}>
                            <Text style={styles.compositionName}>{comp.childName}</Text>
                            <View style={styles.compositionMeta}>
                              <View style={[styles.compositionTypeBadge, isFlower && styles.compositionTypeBadgeFlower]}>
                                <Text style={[styles.compositionTypeText, isFlower && styles.compositionTypeTextFlower]}>
                                  {isFlower ? '🌸 Hoa' : '📦 Phụ kiện'}
                                </Text>
                              </View>
                              <Text style={styles.compositionQuantity}>SL: {comp.quantity}</Text>
                              <Text style={styles.compositionPrice}>{formatVND(comp.childPrice)}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Additional Images */}
                {(() => {
                  let images: string[] = [];
                  try {
                    images = JSON.parse(selectedProduct.images || '[]');
                  } catch (e) {
                    images = [];
                  }
                  return images.length > 1 ? (
                    <View style={styles.productModalSection}>
                      <Text style={styles.productModalSectionTitle}>Hình ảnh khác</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.additionalImagesContainer}>
                        {images.slice(1).map((img: string, idx: number) => (
                          <TouchableOpacity key={idx} onPress={() => setZoomedImage(img)}>
                            <Image
                              source={{ uri: forceHttps(img) }}
                              style={styles.additionalImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null;
                })()}

                <View style={{ height: 20 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCancelModal(false);
          setOrderToCancel(null);
          setCancelReason('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.cancelModalOverlay}>
            <View style={styles.cancelModalContainer}>
              {/* Header */}
              <View style={styles.cancelModalHeader}>
                <View style={styles.cancelModalIconContainer}>
                  <Ionicons name="warning" size={28} color="#DC2626" />
                </View>
                <Text style={styles.cancelModalTitle}>Hủy đơn hàng</Text>
                <Text style={styles.cancelModalSubtitle}>
                  Đơn hàng #{orderToCancel?.code}
                </Text>
              </View>

              {/* Warning Alert */}
              <View style={styles.cancelWarning}>
                <Ionicons name="information-circle" size={20} color="#D97706" />
                <Text style={styles.cancelWarningText}>
                  Sau khi hủy, yêu cầu hoàn tiền sẽ được tạo tự động.
                </Text>
              </View>

              {/* Reason Input */}
              <View style={styles.cancelReasonContainer}>
                <Text style={styles.cancelReasonLabel}>
                  Lý do hủy <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.cancelReasonInput}
                  placeholder="Nhập lý do hủy đơn..."
                  placeholderTextColor="#9CA3AF"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isCancelling}
                />
              </View>

              {/* Actions */}
              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.cancelModalCloseBtn}
                  onPress={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setCancelReason('');
                  }}
                  disabled={isCancelling}
                >
                  <Text style={styles.cancelModalCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cancelModalConfirmBtn,
                    (!cancelReason.trim() || isCancelling) && styles.cancelModalConfirmBtnDisabled
                  ]}
                  onPress={handleSubmitCancel}
                  disabled={!cancelReason.trim() || isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.cancelModalConfirmBtnText}>Xác nhận hủy</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        visible={!!zoomedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomedImage(null)}
      >
        <View style={styles.imageZoomModal}>
          <TouchableOpacity
            style={styles.imageZoomOverlay}
            activeOpacity={1}
            onPress={() => setZoomedImage(null)}
          >
            <TouchableOpacity style={styles.imageZoomClose} onPress={() => setZoomedImage(null)}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            {zoomedImage && (
              <Image
                source={{ uri: forceHttps(zoomedImage) }}
                style={styles.imageZoomed}
                resizeMode="contain"
              />
            )}
            <Text style={styles.imageZoomHint}>Nhấn vào ngoài để đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  resultCount: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  resultCountBold: {
    fontWeight: '600',
    color: '#047857',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#047857',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  filterBadgeTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  orderHeader: {
    padding: 16,
  },
  orderHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#047857',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  timelineDetails: {
    gap: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  timelineLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  timelinePending: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  timelineImage: {
    marginTop: 8,
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineImageThumb: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImageThumb: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productQuantity: {
    fontSize: 13,
    color: '#6B7280',
  },
  productDot: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  productTotal: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  productTotalLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  productTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  paymentBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  paymentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  orderFooter: {
    padding: 16,
    backgroundColor: '#FEF3F2',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#047857',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  clearFilterButton: {
    marginTop: 16,
    backgroundColor: '#047857',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  imageZoomModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageZoomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageZoomClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageZoomed: {
    width: '90%',
    height: '70%',
  },
  imageZoomHint: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  // Product Name Row (for clickable product items)
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  viewDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
    marginLeft: 8,
  },
  viewDetailText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  // Product Detail Modal Styles
  productModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  productModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  productModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productModalLoading: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productModalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  productModalImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  productModalImagePlaceholder: {
    width: '100%',
    height: 200,
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productModalBasicInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  productModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  productModalPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E11D48',
  },
  productModalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  productModalInfoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  productModalInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productModalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  productModalSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  productModalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productModalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  productModalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  compositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  compositionImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compositionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  compositionInfo: {
    flex: 1,
  },
  compositionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  compositionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  compositionTypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  compositionTypeBadgeFlower: {
    backgroundColor: '#FDF2F8',
  },
  compositionTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  compositionTypeTextFlower: {
    color: '#EC4899',
  },
  compositionQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  compositionPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  additionalImagesContainer: {
    marginTop: 8,
  },
  additionalImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  // Cancel Order Modal Styles
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  cancelModalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelModalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  cancelWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#92400E',
  },
  cancelReasonContainer: {
    padding: 20,
    paddingTop: 16,
  },
  cancelReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#DC2626',
  },
  cancelReasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 100,
  },
  cancelModalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelModalCloseBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  cancelModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalConfirmBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  cancelModalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default OrdersHistory;
