import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService, userProfileApi } from "../../services/auth";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const userData = await userProfileApi();
      console.log("User data:", userData);

      if (userData.success && userData.data) {
        setUser(userData.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        setIsLoading(true);
        const isLoggedIn = await authService.isAuthenticated();

        if (!isLoggedIn) {
          router.replace("/(auth)/login");
        } else {
          await fetchUserData();
        }
        setIsLoading(false);
      };

      checkAuth();
    }, [])
  );

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorText}>
            Không thể tải thông tin người dùng
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getGenderDisplay = (gender: string) => {
    const genderMap: any = {
      MALE: { text: "Nam", icon: "♂️" },
      FEMALE: { text: "Nữ", icon: "♀️" },
      OTHER: { text: "Khác", icon: "⚧️" },
    };
    return genderMap[gender] || { text: "Chưa cập nhật", icon: "" };
  };

  const genderInfo = getGenderDisplay(user.gender);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color="#047857" />
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name || "Người dùng"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phone || "Chưa cập nhật"}</Text>

          {user.gender && (
            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>
                {genderInfo.icon} {genderInfo.text}
              </Text>
              {user.age > 0 && (
                <>
                  <Text style={styles.userInfoSeparator}>•</Text>
                  <Text style={styles.userInfoLabel}>{user.age} tuổi</Text>
                </>
              )}
            </View>
          )}

          {user.address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.addressText} numberOfLines={2}>
                {user.address}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color="#047857" />
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn hàng của tôi</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="receipt-outline"
              title="Đơn hàng"
              subtitle="Xem lịch sử đơn hàng"
              onPress={() => {}}
            />
            <MenuItem
              icon="time-outline"
              title="Đang xử lý"
              subtitle="2 đơn hàng"
              badge="2"
              onPress={() => {}}
            />
            <MenuItem
              icon="checkmark-circle-outline"
              title="Đã giao"
              subtitle="10 đơn hàng"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="heart-outline"
              title="Yêu thích"
              subtitle="5 sản phẩm"
              onPress={() => {}}
            />
            <MenuItem
              icon="location-outline"
              title="Địa chỉ giao hàng"
              subtitle="Quản lý địa chỉ"
              onPress={() => {}}
            />
            <MenuItem
              icon="card-outline"
              title="Phương thức thanh toán"
              subtitle="Thẻ & Ví điện tử"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khác</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="notifications-outline"
              title="Thông báo"
              subtitle="Cài đặt thông báo"
              onPress={() => {}}
            />
            <MenuItem
              icon="settings-outline"
              title="Cài đặt"
              subtitle="Cài đặt ứng dụng"
              onPress={() => {}}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Trợ giúp & Hỗ trợ"
              subtitle="Câu hỏi thường gặp"
              onPress={() => {}}
            />
            <MenuItem
              icon="information-circle-outline"
              title="Về chúng tôi"
              subtitle="FlowerPlus.vn"
              onPress={() => {}}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#047857" />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  profileHeader: {
    backgroundColor: "#FFF",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#047857",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  userInfoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  userInfoSeparator: {
    color: "#D1D5DB",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    maxWidth: "90%",
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#047857",
    gap: 6,
    marginTop: 8,
  },
  editButtonText: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#047857",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuSection: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#EF4444",
    gap: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
});
