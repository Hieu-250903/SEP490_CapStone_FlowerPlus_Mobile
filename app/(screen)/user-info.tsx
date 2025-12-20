import { getUserInfoApi, updateUserInfoApi } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    birthDate: "",
  });

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await getUserInfoApi();
            if (response?.data) {
        setUser(response.data);
        setForm({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          phone: response.data.phone || "",
          gender: response.data.gender || "",
          birthDate: response.data.birthDate || "",
        });
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        } finally {
            setLoading(false);
        }
    };

  const handleOpenEdit = () => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      gender: user.gender || "",
      birthDate: user.birthDate || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ hoặc tên");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
      };

      const res = await updateUserInfoApi(payload);

      if (res?.data) {
        setUser(res.data);
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        setEditing(false);
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật thông tin");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Đã xảy ra lỗi khi cập nhật"
      );
    } finally {
      setSaving(false);
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
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                  <Text style={styles.headerSubtitle}>
                    Quản lý và cập nhật hồ sơ của bạn
                  </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
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

                            <View style={styles.statsRow}>
                              <View style={styles.statChip}>
                                <Ionicons
                                  name="shield-checkmark-outline"
                                  size={14}
                                  color="#047857"
                                />
                                <Text style={styles.statChipText}>{user.role}</Text>
                              </View>
                              <View style={styles.statChip}>
                                <Ionicons
                                  name="calendar-outline"
                                  size={14}
                                  color="#6b7280"
                                />
                                <Text style={styles.statChipText}>
                                  Thành viên từ {new Date(user.createdAt).getFullYear()}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={handleOpenEdit}
                            >
                              <Ionicons name="create-outline" size={16} color="#047857" />
                              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
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
        {/* Edit Modal */}
        <Modal
          visible={editing}
          animationType="slide"
          transparent
          onRequestClose={() => !saving && setEditing(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                <TouchableOpacity
                  onPress={() => !saving && setEditing(false)}
                  disabled={saving}
                >
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: "75%" }}
                contentContainerStyle={styles.formContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Họ</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ"
                    value={form.firstName}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, firstName: text }))
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tên"
                    value={form.lastName}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, lastName: text }))
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, phone: text }))
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Giới tính (MALE / FEMALE / OTHER)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập giới tính"
                    autoCapitalize="characters"
                    value={form.gender}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, gender: text.toUpperCase() }))
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: 2000-01-01"
                    value={form.birthDate}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, birthDate: text }))
                    }
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, saving && { opacity: 0.6 }]}
                  onPress={() => !saving && setEditing(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && { opacity: 0.8 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Lưu</Text>
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
        backgroundColor: "#f3f4f6",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    content: {
        paddingBottom: 32,
        paddingHorizontal: 16,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: "#ffffff",
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        marginTop: 16,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 4,
        borderColor: "#e5e7eb",
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
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#f3f4f6",
        gap: 4,
    },
    statChipText: {
        fontSize: 11,
        color: "#374151",
        fontWeight: "500",
    },
    section: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
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
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#047857",
        gap: 6,
    },
    editButtonText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    formGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#f9fafb",
        fontSize: 14,
        color: "#111827",
    },
    modalFooter: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    cancelButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6b7280",
    },
    saveButton: {
        flex: 1,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 12,
        backgroundColor: "#047857",
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
});

export default UserInfoScreen;