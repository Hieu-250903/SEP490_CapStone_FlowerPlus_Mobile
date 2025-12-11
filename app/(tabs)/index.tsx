import ProductCard from "@/components/ProductCard";
import { getAllProduct } from "@/services/product";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const BANNER_IMAGES = [
  "https://vuonhoatuoi.vn/wp-content/uploads/2024/09/banner-bo-hoa-sinh-nhat.png",
  "https://dienhoasaigon.com.vn/wp-content/uploads/2022/03/hoatuoi9x_banner-web-03-scaled.jpg",
  "https://shophoaquynhdao.com/thumbs/1366x560x1/upload/photo/banner-7789-26871.png",
];

const features = [
  { icon: "heart", text: "Miễn Phí Thiệp Xinh" },
  { icon: "star", text: "Hoa Đẹp Chỉ Từ 300k" },
  { icon: "car", text: "Giao Hoa Tận Nơi TPHCM" },
];

const steps = [
  {
    icon: "flower",
    title: "MUA HOA TƯƠI",
    description: "Chọn bộ DIY hoặc tự tạo theo ý thích",
  },
  {
    icon: "play-circle",
    title: "XEM HƯỚNG DẪN",
    description: "Xem tất cả mẹo hay, từ chuẩn bị đến vận chuyển",
  },
  {
    icon: "cube",
    title: "MỞ HỘP VÀ CẮM HOA",
    description: "Biến phòng khách thành studio hoa",
  },
  {
    icon: "sparkles",
    title: "KHOE THÀNH QUẢ",
    description: "Ứng tuyển làm Rose Bowl Parade năm sau",
  },
];

const brands = [
  "REFINERY29",
  "Forbes",
  "domino",
  "The New York Times",
  "weddings",
  "BRIT+CO.",
  "BUSTLE",
];

// Helper function để parse JSON string thành array
const parseImages = (imagesStr: string): string[] => {
  try {
    const parsed = JSON.parse(imagesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getProductImage = (product: any): string => {
  if (product.images) {
    const productImages = parseImages(product.images);
    if (productImages.length > 0) {
      return productImages[0];
    }
  }
  return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTixbrVNY9XIHQBZ1iehMIV0Z9AtHB9dp46lg&s";
};

interface CategoryGroup {
  id: number;
  name: string;
  products: any[];
}

const transformApiProduct = (apiProduct: any) => ({
  id: apiProduct.id,
  name: apiProduct.name,
  price: apiProduct.price || 0,
  discountPrice: apiProduct.salePrice || apiProduct.price || 0,
  image: getProductImage(apiProduct),
  images: apiProduct.images,
  description: apiProduct.description || "",
  categoryId: apiProduct.categories?.[0]?.id,
  categoryName: apiProduct.categories?.[0]?.name,
  stock: apiProduct.stock,
});

export default function HomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categorizedProducts, setCategorizedProducts] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllProduct({
        active: true,
        pageNumber: 1,
        pageSize: 100,
      });

      const apiProducts = response?.data?.listObjects || response?.listObjects || [];

      const transformed = apiProducts
        .filter((p: any) => p.isActive !== false)
        .map((p: any) => transformApiProduct(p));

      setProducts(transformed);

      const categoryMap = new Map<number, CategoryGroup>();
      transformed.forEach((product: any) => {
        if (product.categoryId && product.categoryName) {
          if (!categoryMap.has(product.categoryId)) {
            categoryMap.set(product.categoryId, {
              id: product.categoryId,
              name: product.categoryName,
              products: [],
            });
          }
          categoryMap.get(product.categoryId)!.products.push(product);
        }
      });

      const categorized = Array.from(categoryMap.values()).filter(
        (cat) => cat.products.length > 0
      );
      setCategorizedProducts(categorized);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err?.message || "Không thể tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    carouselRef.current?.scrollToIndex({ index, animated: true });
  };

  const getCategoryEmoji = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    if (name.includes("hồng")) return "🌹";
    if (name.includes("ly")) return "💐";
    if (name.includes("cúc")) return "🌼";
    if (name.includes("tulip")) return "🌷";
    if (name.includes("sinh nhật")) return "🎂";
    if (name.includes("khai trương")) return "🎉";
    if (name.includes("tình yêu") || name.includes("valentine")) return "❤️";
    if (name.includes("cưới")) return "💒";
    return "🌸";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={BANNER_IMAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.carouselItem}>
                <Image
                  source={{ uri: item }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.3)"]}
                  style={styles.carouselOverlay}
                />
              </View>
            )}
          />

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureBadge}>
                <Ionicons
                  name={feature.icon as any}
                  size={18}
                  color="#EF4444"
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.carouselControls}>
            <TouchableOpacity
              style={styles.carouselButton}
              onPress={() => scrollToIndex(Math.max(0, currentIndex - 1))}
            >
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
              {BANNER_IMAGES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.carouselButton}
              onPress={() =>
                scrollToIndex(
                  Math.min(BANNER_IMAGES.length - 1, currentIndex + 1)
                )
              }
            >
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.howItWorksSection}>
          <View style={styles.howItWorksCard}>
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepIconContainer}>
                    <Ionicons
                      name={step.icon as any}
                      size={32}
                      color="#EF4444"
                    />
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {index < steps.length - 1 && (
                    <View style={styles.stepDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Dynamic Category Sections */}
        <View style={styles.productSection}>
          {categorizedProducts.map((category, catIndex) => (
            <View
              key={category.id}
              style={[
                styles.sectionWrapper,
                { backgroundColor: catIndex % 2 === 0 ? "#FFF" : "#F3E2D9" },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {getCategoryEmoji(category.name)} {category.name}
                </Text>
              </View>

              <FlatList
                data={category.products.slice(0, 8)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsHorizontal}
                renderItem={({ item }) => (
                  <View style={{ width: width * 0.45 }}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            </View>
          ))}

          {/* Fallback if no categories */}
          {categorizedProducts.length === 0 && products.length > 0 && (
            <View style={[styles.sectionWrapper, { backgroundColor: "#FFF" }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🌸 Tất cả sản phẩm</Text>
              </View>

              <FlatList
                data={products.slice(0, 8)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsHorizontal}
                renderItem={({ item }) => (
                  <View style={{ width: width * 0.45 }}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            </View>
          )}

          {/* Empty state */}
          {categorizedProducts.length === 0 && products.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
              <Text style={styles.emptySubText}>
                Các sản phẩm mới sẽ sớm được cập nhật
              </Text>
            </View>
          )}
        </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6B7280",
  },
  carouselContainer: {
    position: "relative",
    height: 320,
  },
  carouselItem: {
    width: width,
    height: 320,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  featuresContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  carouselControls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  carouselButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: {
    backgroundColor: "#FFF",
    width: 24,
  },
  howItWorksSection: {
    backgroundColor: "#FAE9E1",
    paddingVertical: 24,
  },
  howItWorksCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FCE7F3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  stepsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  stepItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 20,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FCE7F3",
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 4,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  stepDivider: {
    display: "none",
  },
  lovedBySection: {
    backgroundColor: "#E88A97",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  lovedByTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  brandsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    width: "30%",
    textAlign: "center",
  },
  productSection: {
    marginTop: 0,
  },
  sectionWrapper: {
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },
  productsHorizontal: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
