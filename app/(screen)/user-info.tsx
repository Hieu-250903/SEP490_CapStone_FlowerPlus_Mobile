import { getUserInfoApi } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface User {
    active: boolean;
    avatar: string;
    birthDate: string;
    createdAt: string;
    email: string;
    firstName: string;
    gender: string;
    isActive: boolean;
    lastName: string;
    phone: string | null;
    role: string;
    updatedAt: string;
    userName: string;
}

const UserInfoScreen = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await getUserInfoApi();
            if (response?.data) {
                setUser(response.data);
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Chưa cập nhật";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    const translateGender = (gender: string) => {
        if (gender === "MALE") return "Nam";
        if (gender === "FEMALE") return "Nữ";
        return "Khác";
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e11d48" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {user ? (
                    <>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{
                                        uri: user.avatar || "https://via.placeholder.com/150",
                                    }}
                                    style={styles.avatar}
                                />
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{user.role}</Text>
                                </View>
                            </View>
                            <Text style={styles.name}>
                                {user.firstName} {user.lastName}
                            </Text>
                            <Text style={styles.username}>@{user.userName}</Text>
                        </View>

                        {/* Info Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{user.email}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="call-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                                    <Text style={styles.infoValue}>
                                        {user.phone || "Chưa cập nhật"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Giới tính</Text>
                                    <Text style={styles.infoValue}>
                                        {translateGender(user.gender)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Ngày sinh</Text>
                                    <Text style={styles.infoValue}>
                                        {formatDate(user.birthDate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Ngày tham gia</Text>
                                    <Text style={styles.infoValue}>
                                        {formatDate(user.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Không thể tải thông tin người dùng</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9fafb",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
    },
    content: {
        paddingBottom: 24,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: 32,
        backgroundColor: "#fff",
        marginBottom: 16,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: "#f3f4f6",
    },
    roleBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#e11d48",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#fff",
    },
    roleText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        color: "#6b7280",
    },
    section: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginTop: 16,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginLeft: 56,
    },
    errorContainer: {
        padding: 24,
        alignItems: "center",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 16,
    },
});

export default UserInfoScreen;