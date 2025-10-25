import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/Products";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
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
  const carouselRef = useRef<FlatList>(null);

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

          <View style={styles.lovedBySection}>
            <Text style={styles.lovedByTitle}>ĐƯỢC YÊU THÍCH BỞI</Text>
            <View style={styles.brandsContainer}>
              {brands.map((brand, index) => (
                <Text key={index} style={styles.brandText}>
                  {brand}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.productSection}>
          <View style={[styles.sectionWrapper, { backgroundColor: "#FFF" }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 BÓ HOA RẺ HÔM NAY</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRODUCTS.slice(0, 5)}
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

          <View style={[styles.sectionWrapper, { backgroundColor: "#F3E2D9" }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌹 HOA HỒNG</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRODUCTS.slice(0, 5)}
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

          <View style={[styles.sectionWrapper, { backgroundColor: "#FFF" }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💐 HOA LY</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRODUCTS.slice(0, 5)}
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

          <View style={[styles.sectionWrapper, { backgroundColor: "#F3E2D9" }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌼 HOA CÚC</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRODUCTS.slice(0, 5)}
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
});
