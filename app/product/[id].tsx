import { PRODUCTS } from "@/constants/Products";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const formatVND = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"desc" | "policy" | "shipping">(
    "desc"
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const product = PRODUCTS.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Không tìm thấy sản phẩm</Text>
          <Text style={styles.errorText}>
            Có thể sản phẩm đã được cập nhật hoặc tạm ngưng kinh doanh.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const galleryImages = [product.image, product.image, product.image];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-social-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Ionicons name="sparkles" size={18} color="#EC4899" />
            <Text style={styles.trustBadgeText} numberOfLines={2}>
              <Text style={styles.trustBadgeBold}>Hoa tươi mỗi ngày</Text>
              {"\n"}
              Cắm mới theo đơn
            </Text>
          </View>
          <View style={[styles.trustBadge, styles.trustBadgeGreen]}>
            <Ionicons name="car" size={18} color="#059669" />
            <Text style={styles.trustBadgeText} numberOfLines={2}>
              <Text style={styles.trustBadgeBold}>Giao 2-4 giờ</Text>
              {"\n"}
              Nội thành TPHCM
            </Text>
          </View>
          <View style={[styles.trustBadge, styles.trustBadgeBlue]}>
            <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
            <Text style={styles.trustBadgeText} numberOfLines={2}>
              <Text style={styles.trustBadgeBold}>Đổi miễn phí</Text>
              {"\n"}
              Nếu héo trong 24h
            </Text>
          </View>
        </View>

        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.mainImage}
              resizeMode="cover"
            />

            {product.discount > 0 && (
              <View style={styles.discountBadgeDetail}>
                <Text style={styles.discountBadgeText}>
                  -{product.discount}%
                </Text>
              </View>
            )}

            <View style={styles.freshBadge}>
              <Ionicons name="leaf" size={14} color="#059669" />
              <Text style={styles.freshBadgeText}>Tươi mới</Text>
            </View>

            <TouchableOpacity
              style={styles.favoriteButtonDetail}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#EF4444" : "#FFF"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnails}
          >
            {galleryImages.map((img, idx) => (
              <TouchableOpacity key={idx} style={styles.thumbnail}>
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>Trang chủ</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            <Text style={styles.breadcrumbText}>Chi tiết</Text>
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.badges}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New 100%</Text>
            </View>
          </View>

          <View style={styles.priceCard}>
            {product.originalPrice !== product.discountedPrice && (
              <Text style={styles.originalPriceDetail}>
                {formatVND(product.originalPrice)}
              </Text>
            )}
            <Text style={styles.currentPrice}>
              {formatVND(product.discountedPrice)}
            </Text>
            {product.originalPrice !== product.discountedPrice && (
              <View style={styles.savingBadge}>
                <Text style={styles.savingText}>
                  Tiết kiệm{" "}
                  {formatVND(product.originalPrice - product.discountedPrice)}
                </Text>
              </View>
            )}
            <Text style={styles.priceNote}>
              Giá đã bao gồm giấy gói & thiệp viết tay theo yêu cầu
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Thương hiệu</Text>
                <Text style={styles.infoValue}>Tổng hợp</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tình trạng</Text>
                <Text style={styles.infoValue}>Cắm mới</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Danh mục</Text>
                <Text style={styles.infoValue}>{product.category}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Mã SP</Text>
                <Text style={styles.infoValue}>#{product.id}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Tư vấn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Linking.openURL("https://zalo.me/yourphone")}
            >
              <Text style={styles.zaloIcon}>Z</Text>
              <Text style={styles.secondaryButtonText}>Đặt qua Zalo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <View style={styles.tabsList}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "desc" && styles.tabActive]}
                onPress={() => setActiveTab("desc")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "desc" && styles.tabTextActive,
                  ]}
                >
                  Mô tả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "policy" && styles.tabActive]}
                onPress={() => setActiveTab("policy")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "policy" && styles.tabTextActive,
                  ]}
                >
                  Chính sách
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "shipping" && styles.tabActive,
                ]}
                onPress={() => setActiveTab("shipping")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "shipping" && styles.tabTextActive,
                  ]}
                >
                  Giao hàng
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {activeTab === "desc" && (
                <View>
                  <Text style={styles.tabContentText}>
                    {product.name} là sự lựa chọn hoàn hảo cho những dịp đặc
                    biệt. Hoa được tuyển chọn kỹ lưỡng, đảm bảo độ tươi và chất
                    lượng cao nhất.
                  </Text>
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        Thiết kế phối màu tinh tế, phù hợp nhiều dịp tặng
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        Hoa tuyển chọn, độ nở đẹp, cắm theo layout mẫu
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        Tặng thiệp viết tay & gói quà cao cấp
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "policy" && (
                <View>
                  <Text style={styles.tabContentText}>
                    <Text style={styles.boldText}>Đổi mới trong 24 giờ</Text>{" "}
                    nếu hoa bị dập/héo do vận chuyển.
                  </Text>
                  <Text style={[styles.tabContentText, { marginTop: 12 }]}>
                    Ảnh chụp thành phẩm sẽ được gửi trước khi giao; miễn phí
                    chỉnh sửa nhẹ (thay giấy, thêm nơ).
                  </Text>
                  <Text
                    style={[
                      styles.tabContentText,
                      styles.noteText,
                      { marginTop: 12 },
                    ]}
                  >
                    Lưu ý: Màu hoa có thể chênh lệch 5-10% do mùa vụ & ánh sáng
                    chụp.
                  </Text>
                </View>
              )}

              {activeTab === "shipping" && (
                <View>
                  <Text style={styles.tabContentText}>
                    Giao nội thành trong{" "}
                    <Text style={styles.boldText}>2-4 giờ</Text>, ngoại tỉnh{" "}
                    <Text style={styles.boldText}>1-3 ngày</Text>.
                  </Text>
                  <Text
                    style={[
                      styles.tabContentText,
                      styles.noteText,
                      { marginTop: 12 },
                    ]}
                  >
                    Hỗ trợ giao nhanh theo khung giờ yêu cầu (có phụ phí).
                  </Text>
                </View>
              )}
            </View>
          </View>

          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Text style={styles.relatedTitle}>Có thể bạn sẽ thích</Text>
                <TouchableOpacity onPress={() => router.push("/")}>
                  <Text style={styles.seeMoreText}>Xem thêm</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.relatedGrid}>
                {relatedProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => router.push(`/product/${item.id}`)}
                  >
                    <View style={styles.relatedImageContainer}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.relatedImage}
                      />
                      {item.discount > 0 && (
                        <View style={styles.relatedBadge}>
                          <Text style={styles.relatedBadgeText}>
                            -{item.discount}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.relatedPriceRow}>
                        {item.originalPrice !== item.discountedPrice && (
                          <Text style={styles.relatedOriginalPrice}>
                            {formatVND(item.originalPrice)}
                          </Text>
                        )}
                        <Text style={styles.relatedPrice}>
                          {formatVND(item.discountedPrice)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color="#047857" />
          <Text style={styles.cartButtonText}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton}>
          <Text style={styles.buyNowButtonText}>Mua ngay</Text>
        </TouchableOpacity>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  trustBadges: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  trustBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FCE7F3",
  },
  trustBadgeGreen: {
    borderColor: "#D1FAE5",
  },
  trustBadgeBlue: {
    borderColor: "#DBEAFE",
  },
  trustBadgeText: {
    fontSize: 10,
    color: "#6B7280",
    flex: 1,
    lineHeight: 14,
  },
  trustBadgeBold: {
    fontWeight: "600",
    color: "#374151",
  },
  imageSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainImageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    marginBottom: 12,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  discountBadgeDetail: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  freshBadge: {
    position: "absolute",
    top: 12,
    left: 80,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  freshBadgeText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "600",
  },
  favoriteButtonDetail: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnails: {
    gap: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  contentSection: {
    paddingHorizontal: 16,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  productTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 30,
  },
  badges: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  newBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  priceCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  originalPriceDetail: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 8,
  },
  savingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  savingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  priceNote: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0068FF",
    gap: 8,
  },
  zaloIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0068FF",
  },
  secondaryButtonText: {
    color: "#0068FF",
    fontSize: 15,
    fontWeight: "600",
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabsList: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#047857",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFF",
  },
  tabContent: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabContentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "600",
    color: "#1F2937",
  },
  noteText: {
    color: "#6B7280",
  },
  bulletList: {
    marginTop: 12,
    gap: 8,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeMoreText: {
    fontSize: 13,
    color: "#047857",
    fontWeight: "600",
  },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  relatedCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  relatedImageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
  },
  relatedImage: {
    width: "100%",
    height: "100%",
  },
  relatedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  relatedBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  relatedInfo: {
    padding: 12,
  },
  relatedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    minHeight: 36,
  },
  relatedPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  relatedOriginalPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  relatedPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EF4444",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cartButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cartButtonText: {
    fontSize: 11,
    color: "#047857",
    marginTop: 2,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#047857",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
