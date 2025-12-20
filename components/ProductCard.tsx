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
import { Product } from "../../types";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Parse images from JSON string and get the first image
  const getProductImage = () => {
    try {
      if (product.images) {
        const imageArray = JSON.parse(product.images);
        return imageArray[0] || "https://via.placeholder.com/400";
      }
      return product.image || "https://via.placeholder.com/400";
    } catch (error) {
      return product.image || "https://via.placeholder.com/400";
    }
  };

  const productImage = getProductImage();

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

      if (response?.success) {
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
    product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100
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
          source={{ uri: productImage }}
          style={styles.image}
          resizeMode="cover"
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
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          )}
          <Text style={styles.discountedPrice}>
            {formatPrice(product.discountPrice || product.price)}
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
