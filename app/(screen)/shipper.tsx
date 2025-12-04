import UploadImageRN from "@/components/UploadImageRN";
import { getListOrdersByShipper, updateOrderStatus } from "@/services/order";
import { authService } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const onRefresh = useCallback(() => {
        fetchOrders(true);
    }, []);

    const handleLogout = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
            {
                text: "Hủy",
                style: "cancel",
            },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    await authService.clearAuth();
                    router.replace("/(auth)/login");
                },
            },
        ]);
    };

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
        return deliveryStatuses[0].step;
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
            fetchOrders(true);
        } catch (error) {
            console.error("Error updating order status:", error);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng");
        } finally {
            setSubmitting(false);
        }
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
                    {order.items?.slice(0, 2).map((item) => (
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
            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptyText}>
                Danh sách đơn hàng sẽ hiển thị tại đây
            </Text>
        </View>
    );

    const renderStats = () => {
        const totalRevenue = orders.reduce(
            (sum, order) => sum + order.total,
            0
        );
        const deliveringCount = orders.filter(
            (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERING"
        ).length;
        const deliveredCount = orders.filter(
            (o) => getLatestStatus(o.deliveryStatuses) === "DELIVERED"
        ).length;
        const pendingCount = orders.filter(
            (o) => getLatestStatus(o.deliveryStatuses) === "PENDING_CONFIRMATION"
        ).length;

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={styles.statCardTop}>
                        <Ionicons name="wallet-outline" size={28} color="#047857" />
                        <Text style={styles.statBadgeText}>Doanh thu</Text>
                    </View>
                    <Text style={styles.statAmount}>{formatVND(totalRevenue)}</Text>
                    <Text style={styles.statLabel}>
                        {orders.length} đơn hàng
                    </Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Ionicons name="time-outline" size={22} color="#F59E0B" />
                        <Text style={styles.statNumber}>{pendingCount}</Text>
                        <Text style={styles.statSmallLabel}>Chờ xác nhận</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="bicycle-outline" size={22} color="#6366F1" />
                        <Text style={styles.statNumber}>{deliveringCount}</Text>
                        <Text style={styles.statSmallLabel}>Đang giao</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        <Text style={styles.statNumber}>{deliveredCount}</Text>
                        <Text style={styles.statSmallLabel}>Hoàn thành</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quản lý giao hàng</Text>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
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
                <View>
                    <Text style={styles.headerTitle}>Quản lý giao hàng</Text>
                    <Text style={styles.headerSubtitle}>
                        {orders.length} đơn hàng
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => fetchOrders(true)}
                    >
                        <Ionicons name="refresh" size={22} color="#047857" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    orders.length > 0 ? renderStats : null
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
                                    {Object.keys(STATUS_COLORS).map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.statusOption,
                                                updateFormData.step === status && styles.statusOptionActive,
                                                { borderColor: STATUS_COLORS[status].bg }
                                            ]}
                                            onPress={() => setUpdateFormData({ ...updateFormData, step: status })}
                                        >
                                            <Ionicons
                                                name={STATUS_COLORS[status].icon as any}
                                                size={20}
                                                color={updateFormData.step === status ? STATUS_COLORS[status].text : "#9CA3AF"}
                                            />
                                            <Text
                                                style={[
                                                    styles.statusOptionText,
                                                    updateFormData.step === status && { color: STATUS_COLORS[status].text }
                                                ]}
                                            >
                                                {getStatusLabel(status)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
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
        paddingVertical: 16,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    refreshButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 22,
        backgroundColor: "#F3F4F6",
    },
    logoutButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 22,
        backgroundColor: "#FEE2E2",
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
        paddingBottom: 20,
    },
    statsContainer: {
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statCardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    statBadgeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    statAmount: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#047857",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: "#9CA3AF",
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1F2937",
        marginTop: 8,
    },
    statSmallLabel: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 4,
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
    },
    totalContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    totalLabel: {
        fontSize: 13,
        color: "#6B7280",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#047857",
    },
    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
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
        gap: 8,
    },
    updateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#047857",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    updateButtonText: {
        fontSize: 13,
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
        gap: 8,
    },
    statusOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFF",
    },
    statusOptionActive: {
        backgroundColor: "#F9FAFB",
        borderWidth: 2,
    },
    statusOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
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
