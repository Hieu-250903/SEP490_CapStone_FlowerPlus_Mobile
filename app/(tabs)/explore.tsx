import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Khám phá</Text>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <View style={styles.categoryGrid}>
            <View style={styles.categoryCard}>
              <Ionicons name="restaurant" size={32} color="#007AFF" />
              <Text style={styles.categoryText}>Ẩm thực</Text>
            </View>
            <View style={styles.categoryCard}>
              <Ionicons name="airplane" size={32} color="#007AFF" />
              <Text style={styles.categoryText}>Du lịch</Text>
            </View>
            <View style={styles.categoryCard}>
              <Ionicons name="fitness" size={32} color="#007AFF" />
              <Text style={styles.categoryText}>Thể thao</Text>
            </View>
            <View style={styles.categoryCard}>
              <Ionicons name="musical-notes" size={32} color="#007AFF" />
              <Text style={styles.categoryText}>Âm nhạc</Text>
            </View>
          </View>
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xu hướng</Text>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.trendingCard}>
              <View style={styles.trendingImage} />
              <View style={styles.trendingContent}>
                <Text style={styles.trendingTitle}>Tiêu đề {item}</Text>
                <Text style={styles.trendingDescription}>
                  Mô tả ngắn về nội dung này
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
  },
  trendingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingImage: {
    width: 80,
    height: 80,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  trendingContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  trendingDescription: {
    fontSize: 14,
    color: "#666",
  },
});
