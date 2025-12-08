import UploadImageRN from "@/components/UploadImageRN";
import { getListOrdersByShipper, updateOrderStatus } from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

interface DeliveryStatus {
    id: number;
    step: string;
    eventAt: string;
    note?: string;
    location?: string;
}

interface DeliveryAddress {
    address: string;
    recipientName: string;
    phoneNumber: string;
    province?: string;
    district?: string;
    ward?: string;
}

interface User {
    userName: string;
    phone: string;
    firstName: string;
    lastName: string;
    deliveryAddresses?: DeliveryAddress[];
}

interface Order {
    id: number;
    orderCode: string;
    total: number;
    requestDeliveryTime?: string;
    user: User;
    items: OrderItem[];
    deliveryStatuses: DeliveryStatus[];
}

type FilterStatus = "ALL" | "PENDING_CONFIRMATION" | "PREPARING" | "DELIVERING" | "DELIVERED" | "DELIVERY_FAILED";

const STATUS_COLORS: Record<
    string,
    { bg: string; text: string; icon: string }
> = {
    PENDING_CONFIRMATION: { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" },
    PREPARING: { bg: "#DBEAFE", text: "#1E40AF", icon: "cube-outline" },
    DELIVERING: { bg: "#E0E7FF", text: "#4338CA", icon: "bicycle-outline" },
    DELIVERED: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
    DELIVERY_FAILED: { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" },
};

const STATUS_LABELS: Record<string, string> = {
    PENDING_CONFIRMATION: "Chờ xác nhận",
    PREPARING: "Đang chuẩn bị",
    DELIVERING: "Đang giao",
    DELIVERED: "Giao thành công",
    DELIVERY_FAILED: "Giao thất bại",
};

const ShipperScreen = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");

    // Update status modal states
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updateFormData, setUpdateFormData] = useState({
        step: "",
        note: "",
        location: "",
        imageUrl: "",
    });
    const [submitting, setSubmitting] = useState(false);

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

            const response = await getListOrdersByShipper();
            if (response?.data) {
                const sortedOrders = [...response.data].sort(
                    (a, b) => b.id - a.id
                );
                setOrders(sortedOrders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
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
                orders.filter((order) => {
                    const latestStatus = getLatestStatus(order.deliveryStatuses);
                    return latestStatus === selectedStatus;
                })
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Không xác định";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return "Không xác định";
        }
    };

    const getLatestStatus = (deliveryStatuses: DeliveryStatus[]) => {
        if (!deliveryStatuses || deliveryStatuses.length === 0) {
            return "PENDING_CONFIRMATION";
        }
        return deliveryStatuses[deliveryStatuses.length - 1].step;
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

    const handleOrderPress = (order: Order) => {
        Alert.alert(
            `Đơn hàng #${order.orderCode}`,
            `Khách hàng: ${order.user.firstName} ${order.user.lastName}\nSố điện thoại: ${order.user.phone}\nTổng tiền: ${formatVND(order.total)}`,
            [{ text: "Đóng" }]
        );
    };

    const handleCallCustomer = (phone: string) => {
        Alert.alert("Gọi điện", `Gọi cho khách hàng: ${phone}`, [
            { text: "Hủy", style: "cancel" },
            { text: "Gọi", onPress: () => console.log("Calling:", phone) },
        ]);
    };

    const handleOpenUpdateModal = (order: Order) => {
        setSelectedOrder(order);
        const currentStatus = getLatestStatus(order.deliveryStatuses);
        setUpdateFormData({
            step: currentStatus,
            note: "",
            location: "",
            imageUrl: "",
        });
        setUpdateModalVisible(true);
    };

    const handleCloseUpdateModal = () => {
        setUpdateModalVisible(false);
        setSelectedOrder(null);
        setUpdateFormData({
            step: "",
            note: "",
            location: "",
            imageUrl: "",
        });
    };

    const handleSubmitUpdate = async () => {
        if (!selectedOrder) return;

        if (!updateFormData.step) {
            Alert.alert("Lỗi", "Vui lòng chọn trạng thái giao hàng");
            return;
        }

        setSubmitting(true);
        try {
            await updateOrderStatus(selectedOrder.id, updateFormData);
            Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
            handleCloseUpdateModal();
            fetchOrders(true); // Refresh orders
        } catch (error) {
            console.error("Error updating order status:", error);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng");
        } finally {
            setSubmitting(false);
        }
    };

    const renderFilterTabs = () => {
        const statuses: {
            key: FilterStatus;
            label: string;
            count?: number;
        }[] = [
                { key: "ALL", label: "Tất cả", count: orders.length },
                {
                    key: "PENDING_CONFIRMATION",
                    label: "Chờ xác nhận",
                    count: orders.filter(
                        (o) => getLatestStatus(o.deliveryStatuses) === "PENDING_CONFIRMATION"
                    ).length,
                },
                {
                    key: "PREPARING",
                    label: "Đang chuẩn bị",
                    count: orders.filter(
                        (o) => getLatestStatus(o.deliveryStatuses) === "PREPARING"
                    ).length,
                },
                {
                    key: "DELIVERING",
                    label: "Đang giao",
                    count: orders.filter(
                        (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERING"
                    ).length,
                },
                {
                    key: "DELIVERED",
                    label: "Hoàn thành",
                    count: orders.filter(
                        (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERED"
                    ).length,
                },
                {
                    key: "DELIVERY_FAILED",
                    label: "Thất bại",
                    count: orders.filter(
                        (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERY_FAILED"
                    ).length,
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
        const latestStatus = getLatestStatus(order.deliveryStatuses);
        const statusStyle = getStatusStyle(latestStatus);
        const deliveryAddress = order.user.deliveryAddresses?.[0];

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.7}
            >
                {/* Header */}
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
                            <Text style={styles.orderCode}>#{order.orderCode}</Text>
                            <Text style={styles.orderTime}>
                                {formatDate(order.requestDeliveryTime)}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                    >
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {getStatusLabel(latestStatus)}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Customer Info */}
                <View style={styles.customerSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={16} color="#047857" />
                        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                    </View>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>
                            {order.user.firstName} {order.user.lastName}
                        </Text>
                        <TouchableOpacity
                            style={styles.phoneButton}
                            onPress={() => handleCallCustomer(order.user.phone)}
                        >
                            <Ionicons name="call-outline" size={14} color="#047857" />
                            <Text style={styles.phoneText}>{order.user.phone}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery Address */}
                {deliveryAddress && (
                    <View style={styles.addressSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location-outline" size={16} color="#DC2626" />
                            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                        </View>
                        <Text style={styles.addressText}>
                            {deliveryAddress.recipientName && (
                                <Text style={styles.recipientName}>
                                    {deliveryAddress.recipientName} •{" "}
                                </Text>
                            )}
                            {deliveryAddress.phoneNumber}
                        </Text>
                        <Text style={styles.addressDetail}>
                            {deliveryAddress.address}
                            {deliveryAddress.ward && `, ${deliveryAddress.ward}`}
                            {deliveryAddress.district && `, ${deliveryAddress.district}`}
                            {deliveryAddress.province && `, ${deliveryAddress.province}`}
                        </Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* Order Items */}
                <View style={styles.itemsSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="basket-outline" size={16} color="#7C3AED" />
                        <Text style={styles.sectionTitle}>
                            Sản phẩm ({order.items?.length || 0})
                        </Text>
                    </View>
                    {order.items?.slice(0, 2).map((item, index) => (
                        <View key={item.id} style={styles.itemRow}>
                            {item.productImage &&
                                (item.productImage.startsWith('http://') ||
                                    item.productImage.startsWith('https://')) ? (
                                <Image
                                    source={{ uri: item.productImage }}
                                    style={styles.productImage}
                                    onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
                                />
                            ) : (
                                <View style={[styles.productImage, styles.productImagePlaceholder]}>
                                    <Ionicons name="image-outline" size={20} color="#9CA3AF" />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.productName}
                                </Text>
                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>{formatVND(item.unitPrice)}</Text>
                        </View>
                    ))}
                    {order.items?.length > 2 && (
                        <Text style={styles.moreItems}>
                            +{order.items.length - 2} sản phẩm khác
                        </Text>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Tổng tiền:</Text>
                        <Text style={styles.totalValue}>{formatVND(order.total)}</Text>
                    </View>
                    <View style={styles.footerButtons}>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={() => handleOpenUpdateModal(order)}
                        >
                            <Ionicons name="create-outline" size={14} color="#FFF" />
                            <Text style={styles.updateButtonText}>Cập nhật</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.detailButton}
                            onPress={() => handleOrderPress(order)}
                        >
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
                <Ionicons name="bicycle-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
                {selectedStatus === "ALL"
                    ? "Chưa có đơn hàng nào"
                    : `Không có đơn ${getStatusLabel(selectedStatus).toLowerCase()}`}
            </Text>
            <Text style={styles.emptyText}>
                {selectedStatus === "ALL"
                    ? "Danh sách đơn hàng sẽ hiển thị tại đây"
                    : "Thử chọn trạng thái khác để xem đơn hàng"}
            </Text>
        </View>
    );

    const renderStats = () => {
        const totalRevenue = filteredOrders.reduce(
            (sum, order) => sum + order.total,
            0
        );
        const deliveringCount = orders.filter(
            (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERING"
        ).length;
        const deliveredCount = orders.filter(
            (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERED"
        ).length;

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
                    <Text style={styles.statAmount}>{formatVND(totalRevenue)}</Text>
                    <Text style={styles.statLabel}>
                        {filteredOrders.length} đơn hàng
                    </Text>
                </View>

                <View style={styles.statColumn}>
                    <View style={styles.statCardSmall}>
                        <Ionicons name="bicycle-outline" size={20} color="#6366F1" />
                        <Text style={styles.statNumberSmall}>{deliveringCount}</Text>
                        <Text style={styles.statLabelSmall}>Đang giao</Text>
                    </View>
                    <View style={styles.statCardSmall}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.statNumberSmall}>{deliveredCount}</Text>
                        <Text style={styles.statLabelSmall}>Hoàn thành</Text>
                    </View>
                </View>
            </View>
        );
    };

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.multiRemove(["auth_token", "user_data"]);
                        router.replace("/(auth)/login");
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#DC2626" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quản lý giao hàng</Text>
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
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={24} color="#DC2626" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Quản lý giao hàng {orders.length > 0 && `(${orders.length})`}
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => fetchOrders(true)}
                >
                    <Ionicons name="refresh" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {renderFilterTabs()}

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    filteredOrders.length > 0 ? renderStats : null
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

            {/* Update Status Modal */}
            <Modal
                visible={updateModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseUpdateModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cập nhật trạng thái</Text>
                            <TouchableOpacity onPress={handleCloseUpdateModal}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {selectedOrder && (
                                <View style={styles.orderInfoSection}>
                                    <Text style={styles.orderInfoTitle}>Đơn hàng #{selectedOrder.orderCode}</Text>
                                    <Text style={styles.orderInfoText}>
                                        Khách hàng: {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                                    </Text>
                                </View>
                            )}

                            {/* Status Dropdown */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Trạng thái giao hàng *</Text>
                                <View style={styles.statusOptions}>
                                    {Object.keys(STATUS_COLORS).map((status) => {
                                        const isActive = updateFormData.step === status;
                                        return (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.statusOption,
                                                    isActive && styles.statusOptionActive,
                                                ]}
                                                onPress={() => setUpdateFormData({ ...updateFormData, step: status })}
                                            >
                                                <View style={styles.statusOptionLeft}>
                                                    <View style={[styles.statusIconContainer, { backgroundColor: STATUS_COLORS[status].bg }]}>
                                                        <Ionicons
                                                            name={STATUS_COLORS[status].icon as any}
                                                            size={18}
                                                            color={STATUS_COLORS[status].text}
                                                        />
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.statusOptionText,
                                                            isActive && styles.statusOptionTextActive
                                                        ]}
                                                    >
                                                        {getStatusLabel(status)}
                                                    </Text>
                                                </View>
                                                {isActive && (
                                                    <View style={styles.checkmarkContainer}>
                                                        <Ionicons name="checkmark-circle" size={24} color="#DC2626" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Location Input */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Vị trí hiện tại</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập vị trí hiện tại..."
                                    value={updateFormData.location}
                                    onChangeText={(text) => setUpdateFormData({ ...updateFormData, location: text })}
                                    multiline
                                />
                            </View>

                            {/* Note Input */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Ghi chú</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textAreaInput]}
                                    placeholder="Nhập ghi chú..."
                                    value={updateFormData.note}
                                    onChangeText={(text) => setUpdateFormData({ ...updateFormData, note: text })}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Image Upload */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Hình ảnh</Text>
                                <UploadImageRN
                                    multiple={false}
                                    onChange={(url) => setUpdateFormData({ ...updateFormData, imageUrl: url as string })}
                                    defaultValue={updateFormData.imageUrl}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCloseUpdateModal}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                onPress={handleSubmitUpdate}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Cập nhật</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    orderTime: {
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
        fontSize: 11,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 12,
    },
    customerSection: {
        marginBottom: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    customerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    customerName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
    },
    phoneButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    phoneText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#047857",
    },
    addressSection: {
        marginBottom: 4,
    },
    addressText: {
        fontSize: 13,
        color: "#4B5563",
        marginBottom: 4,
    },
    recipientName: {
        fontWeight: "600",
        color: "#1F2937",
    },
    addressDetail: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
    },
    itemsSection: {
        marginBottom: 4,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    productImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
    },
    productImagePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
        color: "#1F2937",
        marginBottom: 2,
    },
    itemQuantity: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1F2937",
    },
    moreItems: {
        fontSize: 12,
        color: "#6B7280",
        fontStyle: "italic",
        textAlign: "center",
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    totalContainer: {
        flexDirection: "column",
        flex: 1,
        minWidth: 100,
    },
    totalLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#047857",
    },
    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    detailButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#047857",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
    },
    footerButtons: {
        flexDirection: "row",
        gap: 6,
        flexShrink: 0,
    },
    updateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        backgroundColor: "#047857",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    updateButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFF",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    modalContent: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: "row",
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    orderInfoSection: {
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    orderInfoTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#047857",
        marginBottom: 4,
    },
    orderInfoText: {
        fontSize: 14,
        color: "#065F46",
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    statusOptions: {
        gap: 10,
    },
    statusOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
    },
    statusOptionActive: {
        backgroundColor: "#FEF2F2",
        borderColor: "#DC2626",
        borderWidth: 2,
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    statusOptionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    statusIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    statusOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    statusOptionTextActive: {
        color: "#DC2626",
        fontWeight: "700",
    },
    checkmarkContainer: {
        marginLeft: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: "#1F2937",
        backgroundColor: "#FFF",
    },
    textAreaInput: {
        minHeight: 100,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#6B7280",
    },
    submitButton: {
        flex: 1,
        backgroundColor: "#047857",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFF",
    },
});

export default ShipperScreen;
