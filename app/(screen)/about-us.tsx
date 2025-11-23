import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";

export default function AboutUs() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL("tel:+84900123456");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:info@flowerplus.vn");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Về chúng tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="flower" size={64} color="#047857" />
          <Text style={styles.heroTitle}>FlowerPlus</Text>
          <Text style={styles.heroSubtitle}>Hoa tươi – Tinh tế – Thân thiện</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chúng tôi là ai</Text>
          <Text style={styles.sectionText}>
            FlowerPlus là cửa hàng hoa nhỏ chuyên cung cấp các bó hoa tươi
            thủ công cho dịp sinh nhật, kỷ niệm, sự kiện doanh nghiệp và
            trang trí nội thất. Chúng tôi tập trung vào chất lượng hoa, thiết
            kế tinh tế và dịch vụ tận tâm để giúp bạn truyền tải thông điệp
            yêu thương.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sứ mệnh</Text>
          <Text style={styles.sectionText}>
            Mang đến trải nghiệm nhận hoa trọn vẹn: hoa đẹp, tươi lâu và giao
            hàng đúng hẹn. Hỗ trợ các doanh nghiệp nhỏ bằng giải pháp quà tặng
            hoa chuyên nghiệp và linh hoạt.
          </Text>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Địa chỉ</Text>
            <Text style={styles.infoText}>123 Đường Hoa, Quận A, TP. HCM</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Giờ mở cửa</Text>
            <Text style={styles.infoText}>08:00 – 19:00 (Thứ 2 - CN)</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#FFF" />
            <Text style={styles.actionText}>Gọi đặt hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.emailBtn]} onPress={handleEmail}>
            <Ionicons name="mail" size={18} color="#FFF" />
            <Text style={styles.actionText}>Gửi email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đặt hàng theo yêu cầu</Text>
          <Text style={styles.sectionText}>
            Chúng tôi nhận đặt hoa theo yêu cầu với dịch vụ tư vấn về màu sắc,
            phong cách và ngân sách. Liên hệ với chúng tôi để nhận tư vấn
            miễn phí và báo giá nhanh chóng.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  content: { flex: 1 },
  hero: {
    backgroundColor: "#FFF",
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  heroTitle: { fontSize: 22, fontWeight: "700", marginTop: 12, color: "#1F2937" },
  heroSubtitle: { color: "#6B7280", marginTop: 4 },
  section: { padding: 16, backgroundColor: "#FFF", marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 8 },
  sectionText: { color: "#4B5563", lineHeight: 20 },
  sectionRow: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: "#FFF", marginTop: 12 },
  infoBox: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginBottom: 6 },
  infoText: { color: "#4B5563" },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#047857",
    paddingVertical: 12,
    borderRadius: 12,
  },
  emailBtn: { backgroundColor: "#0EA5A4" },
  actionText: { color: "#FFF", marginLeft: 8, fontWeight: "600" },
});
