import { addToCart } from "@/services/cart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Default placeholder image - 使用 HTTPS 和可靠的占位符服务
  const DEFAULT_IMAGE = "https://via.placeholder.com/400x400/EF4444/FFFFFF?text=FlowerPlus";

  // Parse images from JSON string and get the first image
  const getProductImage = () => {
    try {
      if (product.image && typeof product.image === "string") {
        // Nếu image là JSON array string: ["url1","url2"]
        if (product.image.startsWith("[")) {
          const imageArray = JSON.parse(product.image);
          const imageUrl = imageArray[0];
          if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
            return imageUrl;
          }
        }

        // Nếu image là URL trực tiếp
        if (product.image.startsWith("http")) {
          return product.image;
        }
      }
      if (product.image && typeof product.image === "string" && product.image.startsWith("http")) {
        return product.image;
      }
      return DEFAULT_IMAGE;
    } catch (error) {
      console.log("[ProductCard] Error parsing images:", error);
      if (product.image && typeof product.image === "string" && product.image.startsWith("http")) {
        return product.image;
      }
      return DEFAULT_IMAGE;
    }
  };

  const productImage = getProductImage();

  const handleImageError = () => {
    console.log("[ProductCard] Image load error for:", productImage);
    setImageError(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();

    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      const response = await addToCart({
        productId: product.id,
        quantity: 1,
      });

      if (response?.data?.success) {
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng", [
          { text: "OK" },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại.",
        [{ text: "OK" }]
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const hasDiscount =
    typeof product.discountedPrice === "number" &&
    product.discountedPrice < product.originalPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice - product.discountedPrice) /
          product.originalPrice) *
          100
      )
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: imageError ? DEFAULT_IMAGE : productImage,
            cache: "force-cache" // 强制缓存以提高生产构建性能
          }}
          style={styles.image}
          resizeMode="cover"
          onError={handleImageError}
          defaultSource={{ uri: DEFAULT_IMAGE }} // iOS fallback
        />

        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleAddToCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#BE123C" />
          ) : (
            <Ionicons name="cart" size={18} color="#BE123C" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text
            style={styles.productName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.name}
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.description || "Không có mô tả"}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          {hasDiscount && (
            <Text style={styles.price}>
              {formatPrice(product.originalPrice)}
            </Text>
          )}
          <Text style={styles.discountedPrice}>
            {formatPrice(
              hasDiscount
                ? (product.discountedPrice as number)
                : product.originalPrice
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#F97316",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  cartButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    padding: 12,
    height: 120,
  },
  nameContainer: {
    height: 36,
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
  },
  descriptionContainer: {
    height: 32,
    marginBottom: 8,
  },
  description: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },
  priceContainer: {
    gap: 4,
  },
  price: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#BE123C",
  },
});
