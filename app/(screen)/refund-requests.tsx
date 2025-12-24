import { getMyRefundRequests } from "@/services/order";
import { forceHttps } from "@/utils/imageUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RefundRequest {
    id: number;
    orderCode: string;
    refundAmount: number;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
    reason?: string;
    adminNote?: string;
    proofImageUrl?: string;
    processedByName?: string;
    requestedAt: string;
    processedAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
    PENDING: {
        label: "Chờ xử lý",
        bgColor: "#FEF3C7",
        textColor: "#92400E",
        icon: "time-outline",
    },
    PROCESSING: {
        label: "Đang xử lý",
        bgColor: "#DBEAFE",
        textColor: "#1E40AF",
        icon: "sync-outline",
    },
    COMPLETED: {
        label: "Đã hoàn tiền",
        bgColor: "#D1FAE5",
        textColor: "#065F46",
        icon: "checkmark-circle",
    },
    REJECTED: {
        label: "Từ chối",
        bgColor: "#FEE2E2",
        textColor: "#991B1B",
        icon: "close-circle",
    },
};

export default function RefundRequestsScreen() {
    const router = useRouter();
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const fetchRefunds = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await getMyRefundRequests();
            if (response?.data) {
                setRefunds(response.data);
            } else {
                setRefunds([]);
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
            setRefunds([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
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
            return dateString;
        }
    };

    const renderRefundCard = ({ item }: { item: RefundRequest }) => {
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

        return (
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.orderCode}>Đơn #{item.orderCode}</Text>
                        <Text style={styles.requestDate}>
                            Yêu cầu: {formatDate(item.requestedAt)}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: statusConfig.bgColor },
                        ]}
                    >
                        <Ionicons
                            name={statusConfig.icon}
                            size={14}
                            color={statusConfig.textColor}
                        />
                        <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Refund Amount */}
                    <View style={styles.amountContainer}>
                        <Ionicons name="wallet-outline" size={20} color="#047857" />
                        <View style={styles.amountInfo}>
                            <Text style={styles.amountLabel}>Số tiền hoàn</Text>
                            <Text style={styles.amountValue}>
                                {formatCurrency(item.refundAmount)}
                            </Text>
                        </View>
                    </View>

                    {/* Processed At */}
                    {item.processedAt && (
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-done" size={16} color="#6B7280" />
                            <Text style={styles.infoText}>
                                Xử lý: {formatDate(item.processedAt)}
                            </Text>
                        </View>
                    )}

                    {/* Reason */}
                    {item.reason && (
                        <View style={styles.reasonContainer}>
                            <Text style={styles.reasonLabel}>Lý do hủy:</Text>
                            <Text style={styles.reasonText}>{item.reason}</Text>
                        </View>
                    )}

                    {/* Admin Note */}
                    {item.adminNote && (
                        <View style={styles.noteContainer}>
                            <Text style={styles.noteLabel}>Ghi chú từ admin:</Text>
                            <Text style={styles.noteText}>{item.adminNote}</Text>
                        </View>
                    )}

                    {/* Proof Image */}
                    {item.proofImageUrl && (
                        <View style={styles.imageContainer}>
                            <Text style={styles.imageLabel}>Ảnh minh chứng:</Text>
                            <TouchableOpacity
                                onPress={() => setZoomedImage(item.proofImageUrl!)}
                                style={styles.imageWrapper}
                            >
                                <Image
                                    source={{ uri: forceHttps(item.proofImageUrl) }}
                                    style={styles.proofImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="expand-outline" size={16} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Processed By */}
                    {item.processedByName && (
                        <View style={styles.processedByContainer}>
                            <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.processedByText}>
                                Xử lý bởi: {item.processedByName}
                            </Text>
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
            <Text style={styles.emptyTitle}>Chưa có yêu cầu hoàn tiền</Text>
            <Text style={styles.emptyText}>
                Các yêu cầu hoàn tiền của bạn sẽ hiển thị tại đây
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
                    <Text style={styles.headerTitle}>Yêu cầu hoàn tiền</Text>
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
                    Yêu cầu hoàn tiền {refunds.length > 0 && `(${refunds.length})`}
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => fetchRefunds(true)}
                >
                    <Ionicons name="refresh" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                <Text style={styles.descriptionText}>
                    Theo dõi trạng thái hoàn tiền của các đơn hàng đã hủy
                </Text>
            </View>

            <FlatList
                data={refunds}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRefundCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchRefunds(true)}
                        colors={["#047857"]}
                        tintColor="#047857"
                    />
                }
            />

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
                        <TouchableOpacity
                            style={styles.imageZoomClose}
                            onPress={() => setZoomedImage(null)}
                        >
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
    descriptionContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFF",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    descriptionText: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
    },
    listContainer: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 16,
        backgroundColor: "#F9FAFB",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    cardHeaderLeft: {
        flex: 1,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 4,
    },
    requestDate: {
        fontSize: 12,
        color: "#6B7280",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    cardContent: {
        padding: 16,
        gap: 12,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#D1FAE5",
        padding: 12,
        borderRadius: 12,
    },
    amountInfo: {
        flex: 1,
    },
    amountLabel: {
        fontSize: 12,
        color: "#065F46",
    },
    amountValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#047857",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        color: "#6B7280",
    },
    reasonContainer: {
        backgroundColor: "#FEF3C7",
        padding: 12,
        borderRadius: 8,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#92400E",
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 13,
        color: "#78350F",
    },
    noteContainer: {
        backgroundColor: "#DBEAFE",
        padding: 12,
        borderRadius: 8,
    },
    noteLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1E40AF",
        marginBottom: 4,
    },
    noteText: {
        fontSize: 13,
        color: "#1E3A8A",
    },
    imageContainer: {
        gap: 8,
    },
    imageLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
    },
    imageWrapper: {
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
    },
    proofImage: {
        width: "100%",
        height: 180,
        borderRadius: 8,
    },
    imageOverlay: {
        position: "absolute",
        bottom: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 6,
        borderRadius: 16,
    },
    processedByContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    processedByText: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        gap: 12,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    imageZoomModal: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
    },
    imageZoomOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imageZoomClose: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    imageZoomed: {
        width: "90%",
        height: "70%",
    },
    imageZoomHint: {
        position: "absolute",
        bottom: 40,
        color: "#FFF",
        fontSize: 14,
    },
});
