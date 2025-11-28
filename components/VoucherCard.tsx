import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Voucher } from "../services/voucher";

interface VoucherCardProps {
    voucher: Voucher;
    onPress?: () => void;
    isSelected?: boolean;
    showConditions?: boolean;
}

export default function VoucherCard({
    voucher,
    onPress,
    isSelected = false,
    showConditions = true,
}: VoucherCardProps) {
    const formatPrice = (price: number) => {
        return price.toLocaleString("vi-VN") + "đ";
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getVoucherStatus = () => {
        const now = new Date();
        const startsAt = new Date(voucher.startsAt);
        const endsAt = new Date(voucher.endsAt);

        if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
            return {
                status: "used-up",
                label: "Hết lượt",
                color: "#9CA3AF",
                bgColor: "#F3F4F6",
            };
        }
        if (now > endsAt) {
            return {
                status: "expired",
                label: "Hết hạn",
                color: "#9CA3AF",
                bgColor: "#F3F4F6",
            };
        }
        if (now < startsAt) {
            return {
                status: "upcoming",
                label: "Sắp diễn ra",
                color: "#3B82F6",
                bgColor: "#DBEAFE",
            };
        }
        return {
            status: "active",
            label: "Đang hoạt động",
            color: "#10B981",
            bgColor: "#D1FAE5",
        };
    };

    const status = getVoucherStatus();
    const isActive = status.status === "active";

    let discountText = "";
    if (voucher.type === "FIXED") {
        discountText = `Giảm ${formatPrice(voucher.amount || 0)}`;
    } else {
        discountText = `Giảm ${voucher.percent}%`;
        if (voucher.maxDiscountAmount) {
            discountText += ` (tối đa ${formatPrice(voucher.maxDiscountAmount)})`;
        }
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isSelected && styles.containerSelected,
                !isActive && styles.containerInactive,
            ]}
            onPress={onPress}
            disabled={!isActive || !onPress}
            activeOpacity={0.7}
        >
            {/* Left gradient accent */}
            <View style={styles.leftAccent} />

            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="pricetag" size={32} color="#FFF" />
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <View style={styles.header}>
                        <Text style={styles.code}>{voucher.code}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                            <Text style={[styles.statusText, { color: status.color }]}>
                                {status.label}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.discount}>{discountText}</Text>

                    {showConditions && (
                        <View style={styles.conditions}>
                            {voucher.minOrderValue && (
                                <View style={styles.conditionRow}>
                                    <Ionicons name="trending-up" size={14} color="#6B7280" />
                                    <Text style={styles.conditionText}>
                                        Đơn tối thiểu: {formatPrice(voucher.minOrderValue)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.conditionRow}>
                                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                <Text style={styles.conditionText}>
                                    HSD: {formatDateTime(voucher.endsAt)}
                                </Text>
                            </View>

                            {voucher.usageLimit > 0 && (
                                <View style={styles.conditionRow}>
                                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                                    <Text style={styles.conditionText}>
                                        Đã dùng: {voucher.usedCount}/{voucher.usageLimit}
                                    </Text>
                                </View>
                            )}

                            {voucher.applyAllProducts ? (
                                <View style={styles.conditionRow}>
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                    <Text style={[styles.conditionText, { color: "#10B981" }]}>
                                        Áp dụng cho tất cả sản phẩm
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.conditionRow}>
                                    <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                                    <Text style={[styles.conditionText, { color: "#F59E0B" }]}>
                                        Áp dụng cho một số sản phẩm
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Selected indicator */}
                {isSelected && (
                    <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#BE123C"
                        style={styles.checkIcon}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    containerSelected: {
        borderColor: "#BE123C",
        borderWidth: 2,
        backgroundColor: "#FFF1F2",
    },
    containerInactive: {
        opacity: 0.6,
    },
    leftAccent: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        backgroundColor: "#F59E0B",
    },
    content: {
        flexDirection: "row",
        padding: 16,
        paddingLeft: 20,
        alignItems: "flex-start",
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: "#F59E0B",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        gap: 8,
    },
    code: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "600",
    },
    discount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#BE123C",
        marginBottom: 8,
    },
    conditions: {
        gap: 4,
    },
    conditionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    conditionText: {
        fontSize: 12,
        color: "#6B7280",
    },
    checkIcon: {
        marginLeft: 8,
        marginTop: 4,
    },
});
