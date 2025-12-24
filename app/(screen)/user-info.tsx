import { getUserInfoApi, updateProfileApi, changePasswordApi, UpdateProfileData } from "@/services/auth";
import { uploadImage } from "@/services/upload";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form data for editing
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    });

    // Password change modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await getUserInfoApi();
            if (response?.data) {
                setUser(response.data);
                setFormData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    birthDate: formatDateForInput(response.data.birthDate) || '',
                    gender: response.data.gender || 'MALE',
                });
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

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateForBackend = (dateString: string) => {
        if (!dateString) return null;
        // Parse dd/mm/yyyy format
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        return `${year}-${month}-${day}T00:00:00`;
    };

    const translateGender = (gender: string) => {
        if (gender === "MALE") return "Nam";
        if (gender === "FEMALE") return "Nữ";
        return "Khác";
    };

    const handleSave = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ và tên');
            return;
        }

        setIsSaving(true);
        try {
            const dataToSend: UpdateProfileData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || undefined,
                birthDate: formatDateForBackend(formData.birthDate) || undefined,
                gender: formData.gender,
                avatar: user?.avatar, // Preserve current avatar
            };

            await updateProfileApi(dataToSend);
            Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
            setIsEditing(false);
            fetchUserInfo();
        } catch (error: any) {
            Alert.alert(
                'Lỗi',
                error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                birthDate: formatDateForInput(user.birthDate) || '',
                gender: (user.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
            });
        }
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmNewPassword } = passwordData;

        if (!oldPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu cũ');
            return;
        }
        if (!newPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePasswordApi({
                oldPassword: oldPassword.trim(),
                newPassword: newPassword.trim(),
                confirmNewPassword: confirmNewPassword.trim(),
            });
            Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            Alert.alert(
                'Lỗi',
                error?.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleAvatarChange = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để thay đổi avatar');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets[0]) {
                return;
            }

            setIsUploadingAvatar(true);
            const imageUri = result.assets[0].uri;

            const uploadResponse = await uploadImage(imageUri);
            const avatarUrl = uploadResponse?.data || uploadResponse?.data;

            if (!avatarUrl) {
                throw new Error('Không thể tải lên ảnh');
            }

            // Backend requires full profile data when updating
            const dataToSend = {
                firstName: user?.firstName || formData.firstName,
                lastName: user?.lastName || formData.lastName,
                email: user?.email || formData.email,
                phone: user?.phone || formData.phone || undefined,
                birthDate: user?.birthDate || undefined,
                gender: (user?.gender || formData.gender) as 'MALE' | 'FEMALE' | 'OTHER',
                avatar: avatarUrl,
            };

            await updateProfileApi(dataToSend);

            Alert.alert('Thành công', 'Cập nhật avatar thành công!');
            fetchUserInfo();
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            Alert.alert(
                'Lỗi',
                error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật avatar'
            );
        } finally {
            setIsUploadingAvatar(false);
        }
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
                {!isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                        <Ionicons name="create-outline" size={22} color="#e11d48" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
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
                                <TouchableOpacity
                                    style={styles.avatarEditBtn}
                                    onPress={handleAvatarChange}
                                    disabled={isUploadingAvatar}
                                >
                                    {isUploadingAvatar ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="camera" size={16} color="#fff" />
                                    )}
                                </TouchableOpacity>
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
                            <Text style={styles.sectionTitle}>
                                {isEditing ? 'Chỉnh sửa thông tin' : 'Thông tin chi tiết'}
                            </Text>

                            {/* First Name */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Họ</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.input}
                                            value={formData.firstName}
                                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                            placeholder="Nhập họ"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user.firstName}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Last Name */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Tên</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.input}
                                            value={formData.lastName}
                                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                            placeholder="Nhập tên"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user.lastName}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Email */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.input}
                                            value={formData.email}
                                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                                            placeholder="Nhập email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user.email}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Phone */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="call-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.input}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                            placeholder="Nhập số điện thoại"
                                            keyboardType="phone-pad"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>
                                            {user.phone || "Chưa cập nhật"}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Gender */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="male-female-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Giới tính</Text>
                                    {isEditing ? (
                                        <View style={styles.genderContainer}>
                                            {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                                                <TouchableOpacity
                                                    key={g}
                                                    style={[
                                                        styles.genderOption,
                                                        formData.gender === g && styles.genderOptionActive
                                                    ]}
                                                    onPress={() => setFormData({ ...formData, gender: g })}
                                                >
                                                    <Text style={[
                                                        styles.genderOptionText,
                                                        formData.gender === g && styles.genderOptionTextActive
                                                    ]}>
                                                        {g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.infoValue}>
                                            {translateGender(user.gender)}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Birth Date */}
                            <View style={styles.infoItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Ngày sinh</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.input}
                                            value={formData.birthDate}
                                            onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
                                            placeholder="dd/mm/yyyy"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>
                                            {formatDate(user.birthDate)}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Created At - Read only */}
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

                        {/* Action Buttons */}
                        {isEditing ? (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={handleCancel}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.changePasswordButton}
                                    onPress={() => setShowPasswordModal(true)}
                                >
                                    <Ionicons name="lock-closed-outline" size={20} color="#e11d48" />
                                    <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Không thể tải thông tin người dùng</Text>
                    </View>
                )}
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Mật khẩu cũ</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={passwordData.oldPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                                    placeholder="Nhập mật khẩu cũ"
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Mật khẩu mới</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={passwordData.newPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                                    placeholder="Nhập mật khẩu mới"
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Xác nhận mật khẩu mới</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={passwordData.confirmNewPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmNewPassword: text })}
                                    placeholder="Nhập lại mật khẩu mới"
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
                                    }}
                                    disabled={isChangingPassword}
                                >
                                    <Text style={styles.modalCancelBtnText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalConfirmBtn, isChangingPassword && styles.buttonDisabled]}
                                    onPress={handleChangePassword}
                                    disabled={isChangingPassword}
                                >
                                    {isChangingPassword ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalConfirmBtnText}>Đổi mật khẩu</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    editButton: {
        padding: 8,
        marginRight: -8,
    },
    content: {
        paddingBottom: 40,
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
    avatarEditBtn: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: '#e11d48',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
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
        alignItems: "flex-start",
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
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
    },
    input: {
        fontSize: 16,
        color: "#1f2937",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    genderOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    genderOptionActive: {
        backgroundColor: '#e11d48',
        borderColor: '#e11d48',
    },
    genderOptionText: {
        fontSize: 14,
        color: '#6b7280',
    },
    genderOptionTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginLeft: 56,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#e11d48',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    changePasswordButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e11d48',
        backgroundColor: '#fff',
        gap: 8,
    },
    changePasswordText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e11d48',
    },
    errorContainer: {
        padding: 24,
        alignItems: "center",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 16,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInputGroup: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    modalCancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#e11d48',
        alignItems: 'center',
    },
    modalConfirmBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});

export default UserInfoScreen;