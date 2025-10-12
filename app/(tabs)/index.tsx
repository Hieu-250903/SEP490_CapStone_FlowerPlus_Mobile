import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/ProductCard";
import { PRODUCTS } from "../../constants/Products";

const { width } = Dimensions.get("window");

const categories = [
  { id: "1", label: "Hoa Sinh Nhật", icon: "🎂" },
  { id: "2", label: "Hoa Khai Trương", icon: "🎉" },
  { id: "3", label: "Hoa Tốt Nghiệp", icon: "🎓" },
  { id: "4", label: "Bó Hoa", icon: "💐" },
  { id: "5", label: "Bó Hoa Hồng", icon: "🌹" },
  { id: "6", label: "Hộp Hoa Mica", icon: "🎁" },
];

const flowerImagesMobile = [
  "https://flowersight.com/wp-content/uploads/2023/10/lang-hoa-hong-dep-tai-flowersight-min.jpg",
  "https://hoahongsi.com/Upload/product/shimmer-5294.jpg",
  "https://flowersight.com/wp-content/uploads/2024/07/bo-hoa-tulip-10-bong-2.jpg",
  "https://flowersight.com/wp-content/uploads/2024/07/bo-hoa-tulip-10-bong-2.jpg",
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeText}>7:30 - 22:00</Text>
          </View>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>Hoa cao cấp</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>
              Mang lại trải nghiệm đáng nhớ
            </Text>
          </View>

          <TouchableOpacity style={styles.cartIconTop}>
            <Ionicons name="cart-outline" size={22} color="#047857" />
            <View style={styles.cartBadgeTop}>
              <Text style={styles.cartBadgeTextTop}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <LinearGradient
          colors={["#047857", "#065F46"]}
          style={styles.heroBanner}
        >
          {/* Decorative Elements */}
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />

          <View style={styles.heroContent}>
            {/* Brand Title */}
            <Text style={styles.brandTitle}>FLOWERPLUS.VN</Text>

            {/* Subtitle */}
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              ĐẶT HOA ONLINE GIÁ RẺ{"\n"}TẠI TPHCM
            </Text>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Nhập tên hoa cần tìm"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="heart" size={16} color="#FDE68A" />
                <Text style={styles.featureText} numberOfLines={1}>
                  Miễn Phí Thiệp
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="star" size={16} color="#FDE68A" />
                <Text style={styles.featureText} numberOfLines={1}>
                  Từ 300k
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="car" size={16} color="#FDE68A" />
                <Text style={styles.featureText} numberOfLines={1}>
                  Giao Tận Nơi
                </Text>
              </View>
            </View>
          </View>

          {/* Mini Mobile Preview */}
          <View style={styles.mobilePreview}>
            <View style={styles.mobileScreen}>
              {/* Status bar */}
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>19:20</Text>
                <Text style={styles.statusDomain}>flowerplus.vn</Text>
                <View style={styles.statusDots}>
                  <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
                  <View style={[styles.dot, { backgroundColor: "#FBBF24" }]} />
                  <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                </View>
              </View>

              {/* Banner */}
              <View style={styles.mobileBanner}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Mới</Text>
                </View>
                <Text style={styles.mobileBannerText} numberOfLines={1}>
                  Đặt hoa mới hôm nay
                </Text>
              </View>

              {/* Flower Images Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileFlowers}
              >
                {flowerImagesMobile.map((img, idx) => (
                  <View key={idx} style={styles.mobileFlowerCard}>
                    <Image
                      source={{ uri: img }}
                      style={styles.mobileFlowerImage}
                      resizeMode="cover"
                    />
                    {(idx === 0 || idx === 1 || idx === 2) && (
                      <View style={styles.mobileFlowerBadge}>
                        <Text style={styles.mobileFlowerBadgeText}>
                          {idx === 0 ? "Hot" : idx === 1 ? "Sale" : "New"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Action Button */}
              <LinearGradient
                colors={["#F9A8D4", "#F472B6"]}
                style={styles.mobileButton}
              >
                <Text style={styles.mobileButtonText}>Xem ưu đãi</Text>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        {/* Categories Navigation */}
        <View style={styles.categoriesNav}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryNavItem,
                  selectedCategory === cat.id && styles.categoryNavItemActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryNavText,
                    selectedCategory === cat.id && styles.categoryNavTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Section - HOT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Bó Hoa Rẻ Hôm Nay</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsHorizontal}
          >
            {PRODUCTS.filter((p) => p.label === "HOT")
              .slice(0, 4)
              .map((product) => (
                <View key={product.id} style={{ width: width * 0.45 }}>
                  <ProductCard product={product} />
                </View>
              ))}
          </ScrollView>
        </View>

        {/* Products Section - HOA HỒNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌹 Hoa Hồng</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {PRODUCTS.slice(0, 4).map((product) => (
              <View key={product.id} style={styles.productGridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </View>

        {/* Products Section - HOA LY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💐 Hoa Ly</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {PRODUCTS.slice(2, 6).map((product) => (
              <View key={product.id} style={styles.productGridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </View>

        {/* Products Section - HOA CÚC */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌼 Hoa Cúc</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {PRODUCTS.slice(1, 5).map((product) => (
              <View key={product.id} style={styles.productGridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: "#6B7280",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#047857",
  },
  topBarSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  cartIconTop: {
    position: "relative",
    padding: 4,
  },
  cartBadgeTop: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeTextTop: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  categoriesNav: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 20,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryNavItem: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFF",
    gap: 8,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryNavItemActive: {
    backgroundColor: "#047857",
    borderColor: "#10B981",
    shadowColor: "#047857",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryNavText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },
  categoryNavTextActive: {
    color: "#FFF",
  },
  heroBanner: {
    minHeight: 480,
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.15,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: "#F9A8D4",
    top: 20,
    left: 20,
  },
  circle2: {
    width: 180,
    height: 180,
    backgroundColor: "#93C5FD",
    bottom: 20,
    right: 20,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FDE68A",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(253, 224, 71, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  featureText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  mobilePreview: {
    alignItems: "center",
    paddingVertical: 20,
  },
  mobileScreen: {
    width: 270,
    backgroundColor: "#FFF",
    borderRadius: 28,
    borderWidth: 5,
    borderColor: "#374151",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusTime: {
    fontSize: 10,
    color: "#374151",
  },
  statusDomain: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  statusDots: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  mobileBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 6,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  newBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFF",
  },
  mobileBannerText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },
  mobileFlowers: {
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mobileFlowerCard: {
    width: 65,
    height: 85,
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  mobileFlowerImage: {
    width: "100%",
    height: "100%",
  },
  mobileFlowerBadge: {
    position: "absolute",
    top: 3,
    left: 3,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  mobileFlowerBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#047857",
  },
  mobileButton: {
    marginHorizontal: 10,
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  mobileButtonText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFF",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllText: {
    fontSize: 13,
    color: "#047857",
    fontWeight: "600",
  },
  productsHorizontal: {
    gap: 12,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productGridItem: {
    width: "48%",
  },
});
