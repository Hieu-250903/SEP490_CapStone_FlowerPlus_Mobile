import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/Products";
import { getAllProduct } from "@/services/product";
import { getAllCategories } from "@/services/categories";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const flowerImages = [
  "https://flowermoxie.com/cdn/shop/files/glow_up_home_page_3.jpg?format=webp&v=1754412369&width=1296",
  "https://hoahongsi.com/Upload/product/shimmer-5294.jpg",
  "https://flowersight.com/wp-content/uploads/2024/07/bo-hoa-tulip-10-bong-2.jpg",
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

export default function HomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response?.data && response.data.length > 0) {
        // Flatten nested categories
        const flatCategories: any[] = [];
        
        const flatten = (items: any[]) => {
          items.forEach((item) => {
            flatCategories.push({
              id: item.id,
              name: item.name,
            });
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          });
        };

        flatten(response.data);
        
        if (flatCategories.length > 0) {
          setCategories(flatCategories);
          // Set first category as default
          setSelectedCategory(flatCategories[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        active: true,
        pageNumber: 1,
        pageSize: 20,
      };

      if (selectedCategory) {
        const category = categories.find((c) => c.name === selectedCategory);
        if (category) {
          params.categoryId = category.id;
        }
      }

      const response = await getAllProduct(params);
      if (response?.data) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={flowerImages}
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
              {flowerImages.map((_, index) => (
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
                  Math.min(flowerImages.length - 1, currentIndex + 1)
                )
              }
            >
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryTabsContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.categoryTabsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  selectedCategory === item.name && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(item.name)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === item.name && styles.categoryTabTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.productSection}>
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory || "Sản phẩm"}
              </Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#047857" />
              </View>
            ) : products.length > 0 ? (
              <FlatList
                data={products}
                numColumns={2}
                scrollEnabled={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsGrid}
                renderItem={({ item }) => (
                  <View style={{ width: width / 2 - 16 }}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noProductText}>Không có sản phẩm</Text>
            )}
          </View>
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
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noProductText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
  },
  filterBarContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filterBadge: {
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  filterOptionActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#047857",
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#047857",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  filterOptionActive_checkbox: {
    opacity: 1,
  },
  filterOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#047857",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  categoryTabsContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  categoryTabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: "#047857",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryTabTextActive: {
    color: "#FFF",
  },
  productsGrid: {
    paddingHorizontal: 8,
    gap: 8,
  },
});
