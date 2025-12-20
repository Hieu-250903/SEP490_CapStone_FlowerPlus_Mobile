import VoucherCard from "@/components/VoucherCard";
import { getVouchers, Voucher } from "@/services/voucher";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

type TabType = "all" | "active" | "expired";

export default function VouchersScreen() {
    const router = useRouter();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const data = await getVouchers();
            setVouchers(data);
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách voucher");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchVouchers();
        }, [])
    );

    const categorizeVouchers = () => {
        const all = vouchers;
        const active: Voucher[] = [];
        const expired: Voucher[] = [];

        vouchers.forEach((voucher) => {
            if (voucher.status === "ACTIVE") {
                active.push(voucher);
            } else if (voucher.status === "EXPIRED" || voucher.status === "USED") {
                expired.push(voucher);
            }
            // NOT_STARTED vouchers will show in "all" but not in active/expired
        });

        return { all, active, expired };
    };

    const { all, active, expired } = categorizeVouchers();

    const getDisplayVouchers = () => {
        switch (activeTab) {
            case "active":
                return active;
            case "expired":
                return expired;
            default:
                return all;
        }
    };

    const handleCopyVoucher = async (code: string) => {
        try {
            await Clipboard.setStringAsync(code);
            Alert.alert("Thành công", `Đã sao chép mã "${code}"`);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể sao chép mã voucher");
        }
    };

    const renderVoucher = ({ item }: { item: Voucher }) => (
        <VoucherCard
            voucher={item}
            onPress={() => handleCopyVoucher(item.code)}
            showConditions={true}
        />
    );

    const renderEmptyState = () => {
        let message = "Không có voucher nào";
        if (activeTab === "active") {
            message = "Không có voucher đang hoạt động";
        } else if (activeTab === "expired") {
            message = "Không có voucher hết hạn";
        }

        return (
            <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>{message}</Text>
            </View>
        );
    };

    const TabButton = ({
        tab,
        label,
        count,
    }: {
        tab: TabType;
        label: string;
        count: number;
    }) => {
        const isActive = activeTab === tab;
        return (
            <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                </Text>
                <View
                    style={[
                        styles.tabBadge,
                        isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                    ]}
                >
                    <Text
                        style={[
                            styles.tabBadgeText,
                            isActive ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                        ]}
                    >
                        {count}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mã giảm giá</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TabButton tab="all" label="Tất cả" count={all.length} />
                <TabButton tab="active" label="Hoạt động" count={active.length} />
                <TabButton tab="expired" label="Hết hạn" count={expired.length} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#047857" />
                    <Text style={styles.loadingText}>Đang tải voucher...</Text>
                </View>
            ) : (
                <FlatList
                    data={getDisplayVouchers()}
                    renderItem={renderVoucher}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Info Footer */}
            <View style={styles.footer}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.footerText}>
                    Nhấn vào voucher để sao chép mã
                </Text>
            </View>
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
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: "#047857",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    tabTextActive: {
        color: "#FFF",
    },
    tabBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: "center",
    },
    tabBadgeActive: {
        backgroundColor: "#FFF",
    },
    tabBadgeInactive: {
        backgroundColor: "#E5E7EB",
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: "bold",
    },
    tabBadgeTextActive: {
        color: "#047857",
    },
    tabBadgeTextInactive: {
        color: "#6B7280",
    },
    listContent: {
        padding: 16,
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
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: "#9CA3AF",
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    footerText: {
        fontSize: 13,
        color: "#92400E",
    },
});
