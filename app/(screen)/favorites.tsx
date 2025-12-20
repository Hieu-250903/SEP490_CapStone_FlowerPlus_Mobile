import ProductCard from "@/components/ProductCard";
import { getFavoriteProducts, FavoriteProduct } from "@/services/favorites";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

export default function FavoritesScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [hasNext, setHasNext] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchFavorites = async (page: number = 1, refresh: boolean = false) => {
        if (loading && !refresh) return;

        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await getFavoriteProducts(page - 1, pageSize);

            if (response?.success && response?.data) {
                if (page === 1 || refresh) {
                    setProducts(response.data.listObjects);
                } else {
                    setProducts((prev) => [...prev, ...response.data.listObjects]);
                }
                setHasNext(response.data.hasNext);
                setTotalRecords(response.data.totalRecords);
                setPageNumber(page);
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFavorites(1, true);
        }, [])
    );

    const handleRefresh = () => {
        fetchFavorites(1, true);
    };

    const handleLoadMore = () => {
        if (hasNext && !loading) {
            fetchFavorites(pageNumber + 1);
        }
    };

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#047857" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading && products.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#047857" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={80} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
                <Text style={styles.emptyText}>
                    Thêm sản phẩm vào danh sách yêu thích để xem lại sau
                </Text>
                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push("/(tabs)/products")}
                >
                    <Text style={styles.browseButtonText}>Khám phá sản phẩm</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>

                <View style={{ width: 40 }} />
            </View>

            <View style={styles.statsBar}>
                <Text style={styles.statsText}>{totalRecords} sản phẩm</Text>
            </View>

            <FlatList
                data={products}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsList}
                columnWrapperStyle={styles.productRow}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={["#047857"]}
                        tintColor="#047857"
                    />
                }
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <ProductCard product={item} />
                    </View>
                )}
            />
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
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    statsBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFF",
    },
    statsText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    productsList: {
        padding: 16,
        paddingBottom: 80,
    },
    productRow: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    productItem: {
        width: "48%",
    },
    loadingFooter: {
        paddingVertical: 20,
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#1F2937",
        marginTop: 24,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 20,
    },
    loadingText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
    },
    browseButton: {
        backgroundColor: "#047857",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    browseButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
    },
});
