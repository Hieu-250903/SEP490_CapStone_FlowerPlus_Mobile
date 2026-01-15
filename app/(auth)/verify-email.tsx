import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyEmailApi } from "../../services/auth";

export default function VerifyEmailScreen() {
    const { verificationToken } = useLocalSearchParams<{
        verificationToken?: string;
    }>();

    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            Alert.alert("Lỗi", "Mã xác thực phải là 6 chữ số");
            return;
        }

        if (!/^\d+$/.test(verificationCode)) {
            Alert.alert("Lỗi", "Mã xác thực chỉ bao gồm số");
            return;
        }

        if (!verificationToken) {
            Alert.alert("Lỗi", "Không tìm thấy token xác thực");
            return;
        }

        setIsLoading(true);
        try {
            const res = await verifyEmailApi({
                verificationToken: verificationToken,
                verificationCode: verificationCode,
            }) as any;

            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.replace("/(auth)/login");
                }, 1500);
            } else {
                Alert.alert("Lỗi", res.message || "Xác thực không thành công");
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                "Mã xác thực không hợp lệ hoặc đã hết hạn";
            Alert.alert("Lỗi", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <LinearGradient
                        colors={["#047857", "#059669"]}
                        style={styles.successIconContainer}
                    >
                        <Ionicons name="checkmark-circle" size={64} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.successTitle}>Xác Thực Thành Công!</Text>
                    <Text style={styles.successMessage}>
                        Email của bạn đã được xác thực. Bạn sẽ được chuyển đến trang
                        đăng nhập ngay bây giờ.
                    </Text>
                    <View style={styles.successNote}>
                        <Ionicons name="mail-outline" size={20} color="#047857" />
                        <Text style={styles.successNoteText}>
                            Chúng tôi đã gửi email chào mừng đến hộp thư của bạn
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <Ionicons name="arrow-back" size={24} color="#047857" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={["#047857", "#059669"]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="shield-checkmark" size={48} color="#FFF" />
                        </LinearGradient>
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Xác Thực Email</Text>
                        <Text style={styles.subtitle}>
                            Nhập mã xác thực 6 chữ số đã được gửi đến email của bạn để hoàn
                            tất đăng ký
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mã Xác Thực <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mã 6 chữ số"
                                    placeholderTextColor="#9CA3AF"
                                    value={verificationCode}
                                    onChangeText={setVerificationCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!isLoading}
                                />
                            </View>
                            <Text style={styles.hint}>
                                Mã xác thực đã được gửi đến email của bạn
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={
                                    isLoading ? ["#9CA3AF", "#9CA3AF"] : ["#047857", "#059669"]
                                }
                                style={styles.buttonGradient}
                            >
                                {isLoading ? (
                                    <>
                                        <ActivityIndicator color="#FFF" size="small" />
                                        <Text style={styles.buttonText}>Đang Xác Thực...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                        <Text style={styles.buttonText}>Xác Thực Email</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.helpContainer}>
                            <Ionicons name="information-circle" size={16} color="#6B7280" />
                            <Text style={styles.helpText}>
                                Không nhận được email?{" "}
                                <Text style={styles.helpLink}>Gửi lại mã</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#D1FAE5",
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    iconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    titleContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    required: {
        color: "#EF4444",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: "#1F2937",
        letterSpacing: 4,
        fontWeight: "600",
    },
    hint: {
        fontSize: 12,
        color: "#6B7280",
    },
    verifyButton: {
        marginTop: 8,
    },
    buttonGradient: {
        height: 52,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    helpContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
    },
    helpText: {
        fontSize: 14,
        color: "#6B7280",
    },
    helpLink: {
        color: "#047857",
        fontWeight: "600",
    },
    // Success state
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    successIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#047857",
        marginBottom: 12,
    },
    successMessage: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 24,
    },
    successNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    successNoteText: {
        flex: 1,
        fontSize: 13,
        color: "#047857",
    },
});
