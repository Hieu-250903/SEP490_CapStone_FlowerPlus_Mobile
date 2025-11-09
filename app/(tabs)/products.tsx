import ProductCard from "@/components/ProductCard";
import { getAllCategories } from "@/services/categories";
import { getAllProduct } from "@/services/product";
import { Category, Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SortOption = "default" | "price-asc" | "price-desc" | "name" | "newest";
type PriceRange = "all" | "0-300" | "300-500" | "500-1000" | "1000+";

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [hasNext, setHasNext] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pageNumber, selectedCategory]);

  const fetchProducts = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const params: any = {
        active: true,
        pageNumber: pageNumber - 1, // API dùng index 0
        pageSize,
      };

      if (selectedCategory) {
        const category = categories.find((c) => c.name === selectedCategory);
        if (category) {
          params.categoryId = category.id;
        }
      }

      const res = await getAllProduct(params);

      if (res?.data) {
        if (pageNumber === 1) {
          setProducts(res.data.listObjects);
        } else {
          setProducts((prev) => [...prev, ...res.data.listObjects]);
        }
        setHasNext(res.data.hasNext);
        setTotalRecords(res.data.totalRecords);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await getAllCategories();
    if (res?.data) {
      setCategories(res.data);
    }
  };

  const loadMore = () => {
    if (hasNext && !loading) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const sortOptions = [
    { value: "default", label: "Mặc định", icon: "list-outline" },
    { value: "price-asc", label: "Giá thấp đến cao", icon: "arrow-up-outline" },
    {
      value: "price-desc",
      label: "Giá cao đến thấp",
      icon: "arrow-down-outline",
    },
    { value: "name", label: "Tên A-Z", icon: "text-outline" },
    { value: "newest", label: "Mới nhất", icon: "time-outline" },
  ];

  const priceRanges = [
    { value: "all", label: "Tất cả" },
    { value: "0-300", label: "Dưới 300k" },
    { value: "300-500", label: "300k - 500k" },
    { value: "500-1000", label: "500k - 1tr" },
    { value: "1000+", label: "Trên 1tr" },
  ];

  const getFilteredProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priceRange !== "all") {
      filtered = filtered.filter((p) => {
        const price = p.discountPrice || p.price;
        switch (priceRange) {
          case "0-300":
            return price < 300000;
          case "300-500":
            return price >= 300000 && price < 500000;
          case "500-1000":
            return price >= 500000 && price < 1000000;
          case "1000+":
            return price >= 1000000;
          default:
            return true;
        }
      });
    }

    switch (sortBy) {
      case "price-asc":
        filtered.sort(
          (a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)
        );
        break;
      case "price-desc":
        filtered.sort(
          (a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price)
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        filtered.reverse();
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const activeFiltersCount = [
    selectedCategory ? 1 : 0,
    priceRange !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange("all");
    setSortBy("default");
    setSearchQuery("");
    setPageNumber(1);
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#047857" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sản phẩm</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="heart-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="cart-outline" size={24} color="#1F2937" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons
              name="filter"
              size={18}
              color={activeFiltersCount > 0 ? "#FFF" : "#374151"}
            />
            <Text
              style={[
                styles.filterButtonText,
                activeFiltersCount > 0 && styles.filterButtonTextActive,
              ]}
            >
              Lọc
            </Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical" size={18} color="#374151" />
            <Text style={styles.sortButtonText}>
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>{totalRecords} sản phẩm</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Xóa lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
              <Text style={styles.emptyText}>
                Thử thay đổi từ khóa hoặc bộ lọc
              </Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Danh mục</Text>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedCategory && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(null);
                    setPageNumber(1);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !selectedCategory && styles.filterOptionTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                  {!selectedCategory && (
                    <Ionicons name="checkmark" size={20} color="#047857" />
                  )}
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.filterOption,
                      selectedCategory === cat.name &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.name);
                      setPageNumber(1);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCategory === cat.name &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {selectedCategory === cat.name && (
                      <Ionicons name="checkmark" size={20} color="#047857" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.filterOption,
                      priceRange === range.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setPriceRange(range.value as PriceRange)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        priceRange === range.value &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                    {priceRange === range.value && (
                      <Ionicons name="checkmark" size={20} color="#047857" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={clearFilters}
              >
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sắp xếp</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(option.value as SortOption);
                    setShowSortModal(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={sortBy === option.value ? "#047857" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#047857"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    position: "relative",
    padding: 4,
  },
  cartBadge: {
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
  cartBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#047857",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "#FFF",
  },
  filterCount: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#047857",
  },
  sortButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  sortButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  resultsText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: "#047857",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    gap: 10,
  },
  filterOptionActive: {
    backgroundColor: "#D1FAE5",
  },
  filterOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: "#047857",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  sortOptions: {
    padding: 20,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: "#D1FAE5",
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  sortOptionTextActive: {
    color: "#047857",
    fontWeight: "600",
  },
});
