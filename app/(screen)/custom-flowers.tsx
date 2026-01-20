
import { userProfileApi } from "@/services/auth";
import { checkoutProduct } from "@/services/order";
import {
  createCustomProduct,
  getProductsByType
} from "@/services/product";
import { Product } from "@/types";
import { formatVND } from "@/utils/imageUtils";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width } = Dimensions.get("window");

type TabType = "create" | "existing";

export default function ProductCustomImprovedUI() {
  const [activeTab, setActiveTab] = useState<TabType>("create");
  const [selectedExistingProduct, setSelectedExistingProduct] =
    useState<any>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",

    flowerSelections: [] as {
      childId: number;
      name: string;
      quantity: number;
      images?: string[];
      price?: number;
    }[],
    itemSelections: [] as {
      childId: number;
      name: string;
      quantity: number;
      images?: string[];
      price?: number;
    }[],
    uploadedImages: [] as string[],
  });

  const [orderForm, setOrderForm] = useState({
    recipientName: "",
    shippingAddress: "",
    phoneNumber: "",
    note: "",
    quantity: 1,
    requestDeliveryTime: "",
    deliveryDate: null as Date | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showFlowerModal, setShowFlowerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [customProducts, setCustomProducts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    fetchItems();
    fetchAddresses();
    fetchCustomProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params: any = {
        type: "FLOWER",
        active: true,
        pageNumber: 1,
        pageSize: 1000,
      };

      const res = await getProductsByType(params);
      if (res?.data) {
        setProducts(res.data.listObjects || res.data);
      }
    } catch (error) {
      console.error("Error fetching flowers:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const params: any = {
        type: "ITEM",
        active: true,
        pageNumber: 1,
        pageSize: 1000,
      };

      const res = await getProductsByType(params);
      if (res?.data) {
        setItems(res.data.listObjects || res.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await userProfileApi();
      console.log("res", res);
      if (res?.data) {
        setAddresses(res.data.deliveryAddresses || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const fetchCustomProducts = async () => {
    try {
      const params: any = {
        active: true,
        custom: true,
        pageNumber: 1,
        pageSize: 1000,
      };

      const res = await getProductsByType(params);
      if (res?.data) {
        setCustomProducts(res.data.listObjects || res.data);
      }
    } catch (error) {
      console.error("Error fetching custom products:", error);
    }
  };

  const parseImages = (imagesString: string): string[] => {
    try {
      return JSON.parse(imagesString);
    } catch {
      return [];
    }
  };



  const handleQuantityChange = (
    type: "flower" | "item",
    childId: number,
    value: number
  ) => {
    setForm((prev) => {
      const selections =
        type === "flower" ? prev.flowerSelections : prev.itemSelections;
      const updatedSelections = selections.map((item) =>
        item.childId === childId ? { ...item, quantity: value } : item
      );
      return {
        ...prev,
        [`${type}Selections`]: updatedSelections,
      };
    });
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddressId(address.id);
    setOrderForm((prev) => ({
      ...prev,
      recipientName: address.recipientName || "",
      shippingAddress: address.address,
      phoneNumber: address.phoneNumber,
    }));
    setShowAddressModal(false);
  };

  const handleSubmitProduct = async () => {
    setError("");

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (
      form.flowerSelections.length === 0 &&
      form.itemSelections.length === 0
    ) {
      setError("Vui lòng chọn ít nhất một loại hoa hoặc phụ kiện");
      return;
    }

    setLoading(true);

    try {


      const compositions = [
        ...form.flowerSelections.map((f) => ({
          childId: f.childId,
          quantity: f.quantity,
        })),
        ...form.itemSelections.map((i) => ({
          childId: i.childId,
          quantity: i.quantity,
        })),
      ];

      const compositionsWithDetails = [
        ...form.flowerSelections.map((f) => ({
          childId: f.childId,
          childName: f.name,
          quantity: f.quantity,
          childPrice: f.price || 0,
        })),
        ...form.itemSelections.map((i) => ({
          childId: i.childId,
          childName: i.name,
          quantity: i.quantity,
          childPrice: i.price || 0,
        })),
      ];

      const response = await createCustomProduct({
        name: form.name,
        description: form.description,
        images: form.uploadedImages,
        compositions,
      });

      if (response?.data) {
        const newProduct = {
          ...response.data,
          compositions: compositionsWithDetails,
        };
        setCreatedProduct(newProduct);
        setCurrentStep(2);
      }
    } catch (error: any) {
      console.error("Error creating product:", error);
      setError(
        error?.response?.data?.message ||
        "Không thể tạo sản phẩm. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    setError("");

    if (!orderForm.recipientName.trim()) {
      setError("Vui lòng nhập tên người nhận");
      return;
    }
    if (!orderForm.shippingAddress.trim()) {
      setError("Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    if (!orderForm.phoneNumber.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }

    // Validate Vietnamese phone number
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(orderForm.phoneNumber.trim())) {
      setError("Số điện thoại không hợp lệ (phải là sốViệt Nam 10 chữ số)");
      return;
    }

    setLoading(true);

    try {
      const product = createdProduct || selectedExistingProduct;
      const orderData: any = {
        quantity: orderForm.quantity,
        shippingAddress: orderForm.shippingAddress,
        phoneNumber: orderForm.phoneNumber,
        note: orderForm.note,
      };

      if (createdProduct) {
        orderData.customProduct = {
          name: createdProduct.name,
          description: createdProduct.description,
          images:
            typeof createdProduct.images === "string"
              ? JSON.parse(createdProduct.images)
              : createdProduct.images,
          compositions: createdProduct.compositions,
        };
      } else if (selectedExistingProduct) {
        orderData.productId = selectedExistingProduct.id;
      }

      const response = await checkoutProduct({
        cancelUrl: "",
        note: orderForm.note,
        productId: product.id,
        quantity: orderForm.quantity,
        recipientName: orderForm.recipientName,
        requestDeliveryTime: orderForm.deliveryDate ? orderForm.deliveryDate.toISOString() : null,
        shippingAddress: orderForm.shippingAddress,
        userId: addresses.find((address) => address.id === selectedAddressId)?.userId,
      });
      if (response) {
        Alert.alert(
          "Đặt hàng thành công",
          "Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã tin tưởng!",
          [
            {
              text: "OK",
              onPress: () => {
                setCurrentStep(1);
                setCreatedProduct(null);
                setSelectedExistingProduct(null);
                setActiveTab("create");
                setSelectedAddressId(null);
                setForm({
                  name: "",
                  description: "",

                  flowerSelections: [],
                  itemSelections: [],
                  uploadedImages: [],
                });
                setOrderForm({
                  recipientName: "",
                  shippingAddress: "",
                  phoneNumber: "",
                  note: "",
                  quantity: 1,
                  requestDeliveryTime: "",
                  deliveryDate: null,
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setError(
        error?.response?.data?.message ||
        "Không thể đặt hàng. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (
    type: "flower" | "item",
    option: { id: number; name: string; images?: string; price?: number }
  ) => {
    setForm((prev) => {
      const key = type === "flower" ? "flowerSelections" : "itemSelections";
      const selections = prev[key];
      const isSelected = selections.some((s) => s.childId === option.id);

      if (isSelected) {
        return {
          ...prev,
          [key]: selections.filter((s) => s.childId !== option.id),
        };
      }

      const newItem = {
        childId: option.id,
        name: option.name,
        quantity: 1,
        images: option.images ? parseImages(option.images) : [],
        price: option.price,
      };

      return {
        ...prev,
        [key]: [...selections, newItem],
      };
    });

    // Close modal after selection
    if (type === "flower") setShowFlowerModal(false);
    if (type === "item") setShowItemModal(false);
  };

  const handleSelectExistingProduct = (product: any) => {
    setSelectedExistingProduct(product);
    setCurrentStep(2);
  };

  const calculateTotalPrice = (product: any) => {
    if (!product.compositions || product.compositions.length === 0) {
      return 0;
    }
    return product.compositions.reduce((total: number, comp: any) => {
      return total + (comp.childPrice || 0) * comp.quantity;
    }, 0);
  };
  const handleBack = () => {
    router.back();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              {currentStep === 1 ? (
                <TouchableOpacity onPress={handleBack}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="cart" size={24} color="#fff" />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {currentStep === 1
                  ? activeTab === "create"
                    ? "Tạo Hoa Tùy Chỉnh"
                    : "Chọn Sản Phẩm Có Sẵn"
                  : "Thông Tin Đặt Hàng"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentStep === 1
                  ? activeTab === "create"
                    ? "Thiết kế bó hoa theo ý muốn"
                    : "Chọn từ các mẫu đã tạo trước"
                  : "Hoàn tất thông tin giao hàng"}
              </Text>
            </View>
          </View>

          {activeTab === "create" && (
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepItem,
                  currentStep === 1 && styles.stepItemActive,
                ]}
              >
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 1 && styles.stepCircleActive,
                  ]}
                >
                  {currentStep > 1 ? (
                    <Feather name="check" size={16} color="#fff" />
                  ) : (
                    <Text style={styles.stepNumber}>1</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    currentStep === 1 && styles.stepTextActive,
                  ]}
                >
                  Thiết kế
                </Text>
              </View>
              <Feather
                name="arrow-right"
                size={20}
                color="rgba(255,255,255,0.6)"
              />
              <View
                style={[
                  styles.stepItem,
                  currentStep === 2 && styles.stepItemActive,
                ]}
              >
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 2 && styles.stepCircleActive,
                  ]}
                >
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text
                  style={[
                    styles.stepText,
                    currentStep === 2 && styles.stepTextActive,
                  ]}
                >
                  Đặt hàng
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "create" && styles.tabActive]}
            onPress={() => {
              setActiveTab("create");
              setCurrentStep(1);
              setSelectedExistingProduct(null);
            }}
          >
            <Feather
              name="plus"
              size={20}
              color={activeTab === "create" ? "#e11d48" : "#6b7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "create" && styles.tabTextActive,
              ]}
            >
              Tạo Mới
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "existing" && styles.tabActive]}
            onPress={() => {
              setActiveTab("existing");
              setCurrentStep(1);
              setCreatedProduct(null);
            }}
          >
            <Feather
              name="list"
              size={20}
              color={activeTab === "existing" ? "#e11d48" : "#6b7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "existing" && styles.tabTextActive,
              ]}
            >
              Có Sẵn
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 1 && activeTab === "create" ? (
            <View style={styles.form}>
              {/* Info Box */}
              <View style={styles.infoBox}>
                <View style={styles.infoHeader}>
                  <MaterialCommunityIcons
                    name="heart"
                    size={18}
                    color="#e11d48"
                  />
                  <Text style={styles.infoTitle}>Tạo hoa tùy chỉnh</Text>
                </View>
                <Text style={styles.infoText}>
                  Tạo một bó hoa độc đáo theo ý muốn của bạn với các loại hoa và
                  phụ kiện bạn chọn.
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tên sản phẩm <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(text) => setForm((s) => ({ ...s, name: text }))}
                  placeholder="Ví dụ: Bó hoa sinh nhật đặc biệt"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) =>
                    setForm((s) => ({ ...s, description: text }))
                  }
                  placeholder="Mô tả chi tiết về sản phẩm của bạn..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Compositions Section */}
              <View style={styles.compositionSection}>
                <Text style={styles.sectionTitle}>Thành phần sản phẩm</Text>

                {/* Flower Selector */}
                <View style={styles.selectorGroup}>
                  <View style={styles.selectorHeader}>
                    <MaterialCommunityIcons
                      name="flower"
                      size={16}
                      color="#e11d48"
                    />
                    <Text style={styles.selectorLabel}>HOA</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowFlowerModal(true)}
                  >
                    <Text style={styles.selectorButtonText}>
                      {form.flowerSelections.length > 0
                        ? `${form.flowerSelections.length} loại hoa đã chọn`
                        : "Chọn hoa..."}
                    </Text>
                    <Feather name="plus" size={20} color="#e11d48" />
                  </TouchableOpacity>

                  {/* Selected Flowers */}
                  {form.flowerSelections.map((f) => {
                    const firstImage =
                      f.images?.[0] || "https://via.placeholder.com/60?text=Hoa";
                    return (
                      <View key={f.childId} style={styles.selectionItem}>
                        <Image
                          source={{ uri: firstImage }}
                          style={styles.selectionImage}
                        />
                        <View style={styles.selectionInfo}>
                          <Text style={styles.selectionName}>{f.name}</Text>
                          {f.price && (
                            <Text style={styles.selectionPrice}>
                              {f.price.toLocaleString("vi-VN")}đ/bông
                            </Text>
                          )}
                        </View>
                        <TextInput
                          style={styles.quantityInput}
                          value={String(f.quantity)}
                          onChangeText={(text) =>
                            handleQuantityChange(
                              "flower",
                              f.childId,
                              Number(text) || 1
                            )
                          }
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() =>
                            handleSelect("flower", {
                              id: f.childId,
                              name: f.name,
                              images: JSON.stringify(f.images),
                            })
                          }
                        >
                          <Feather name="x" size={18} color="#e11d48" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Item Selector */}
                <View style={styles.selectorGroup}>
                  <View style={styles.selectorHeader}>
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={16}
                      color="#e11d48"
                    />
                    <Text style={styles.selectorLabel}>PHỤ KIỆN</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowItemModal(true)}
                  >
                    <Text style={styles.selectorButtonText}>
                      {form.itemSelections.length > 0
                        ? `${form.itemSelections.length} phụ kiện đã chọn`
                        : "Chọn phụ kiện..."}
                    </Text>
                    <Feather name="plus" size={20} color="#e11d48" />
                  </TouchableOpacity>

                  {/* Selected Items */}
                  {form.itemSelections.map((it) => {
                    const firstImage =
                      it.images?.[0] ||
                      "https://via.placeholder.com/60?text=Item";
                    return (
                      <View key={it.childId} style={styles.selectionItem}>
                        <Image
                          source={{ uri: firstImage }}
                          style={styles.selectionImage}
                        />
                        <View style={styles.selectionInfo}>
                          <Text style={styles.selectionName}>{it.name}</Text>
                          {it.price && (
                            <Text style={styles.selectionPrice}>
                              {it.price.toLocaleString("vi-VN")}đ
                            </Text>
                          )}
                        </View>
                        <TextInput
                          style={styles.quantityInput}
                          value={String(it.quantity)}
                          onChangeText={(text) =>
                            handleQuantityChange(
                              "item",
                              it.childId,
                              Number(text) || 1
                            )
                          }
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() =>
                            handleSelect("item", {
                              id: it.childId,
                              name: it.name,
                              images: JSON.stringify(it.images),
                            })
                          }
                        >
                          <Feather name="x" size={18} color="#e11d48" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Image Upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.sectionTitle}>Hình ảnh sản phẩm</Text>
                <Text style={styles.uploadDescription}>
                  Tải lên hình ảnh mẫu cho sản phẩm của bạn (tùy chọn)
                </Text>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsMultipleSelection: true,
                      quality: 0.8,
                      aspect: [4, 3],
                    });

                    if (!result.canceled && result.assets) {
                      const newImages = result.assets.map(asset => asset.uri);
                      setForm(prev => ({
                        ...prev,
                        uploadedImages: [...prev.uploadedImages, ...newImages],
                      }));
                    }
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={24} color="#e11d48" />
                  <Text style={styles.uploadButtonText}>
                    {form.uploadedImages.length > 0
                      ? `Đã chọn ${form.uploadedImages.length} ảnh`
                      : "Chọn ảnh từ thư viện"}
                  </Text>
                </TouchableOpacity>

                {/* Image Preview */}
                {form.uploadedImages.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagePreviewContainer}
                  >
                    {form.uploadedImages.map((uri, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image
                          source={{ uri }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            setForm(prev => ({
                              ...prev,
                              uploadedImages: prev.uploadedImages.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>


              {/* Error Message */}
              {error && (
                <View style={styles.errorBox}>
                  <Feather name="x" size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitProduct}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Tiếp Theo</Text>
                    <Feather name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : currentStep === 1 && activeTab === "existing" ? (
            <View style={styles.existingList}>
              {customProducts.map((product: any) => {
                const productImages = parseImages(product.images || "[]");
                const firstImage =
                  productImages[0] || "https://via.placeholder.com/80?text=Hoa";
                const totalPrice = calculateTotalPrice(product);

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => handleSelectExistingProduct(product)}
                  >
                    <Image
                      source={{ uri: firstImage }}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>
                      {totalPrice > 0 && (
                        <Text style={styles.productPrice}>
                          {totalPrice.toLocaleString("vi-VN")}đ
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.form}>
              {/* Product Preview */}
              {(createdProduct || selectedExistingProduct) && (
                <View style={styles.productPreview}>
                  <View style={styles.productPreviewHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.productPreviewTitle}>
                      Sản phẩm đã chọn
                    </Text>
                  </View>
                  {(() => {
                    const product = createdProduct || selectedExistingProduct;
                    const productImages = parseImages(product.images || "[]");
                    const firstImage =
                      productImages[0] ||
                      "https://via.placeholder.com/128?text=Hoa";
                    const totalPrice = calculateTotalPrice(product);

                    return (
                      <View style={styles.productPreviewContent}>
                        <Image
                          source={{ uri: firstImage }}
                          style={styles.productPreviewImage}
                        />
                        <View style={styles.productPreviewInfo}>
                          <Text style={styles.productPreviewName}>
                            {product.name}
                          </Text>
                          <Text
                            style={styles.productPreviewDescription}
                            numberOfLines={2}
                          >
                            {product.description}
                          </Text>
                          {totalPrice > 0 && (
                            <Text style={styles.productPreviewPrice}>
                              Tổng giá: {totalPrice.toLocaleString("vi-VN")}đ
                            </Text>
                          )}
                          {product.compositions && product.compositions.length > 0 && (
                            <View style={styles.compositionPreview}>
                              <Text style={styles.compositionTitle}>Thành phần:</Text>
                              <View style={styles.compositionList}>
                                {product.compositions.map((comp: any) => (
                                  <View key={comp.childId || comp.childProductId} style={styles.compositionBadge}>
                                    <Text style={styles.compositionText}>
                                      {comp.childName} x{comp.quantity}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Order Form */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tên người nhận <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={orderForm.recipientName}
                  onChangeText={(text) => {
                    setSelectedAddressId(null);
                    setOrderForm((s) => ({ ...s, recipientName: text }));
                  }}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Địa chỉ giao hàng <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.addressButton}
                    onPress={() => setShowAddressModal(true)}
                  >
                    <Ionicons name="location-outline" size={14} color="#e11d48" />
                    <Text style={styles.addressButtonText}>Chọn địa chỉ</Text>
                  </TouchableOpacity>
                </View>

                {selectedAddressId && (
                  <View style={styles.selectedAddressBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.selectedAddressText}>
                      Đã chọn địa chỉ có sẵn
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAddressId(null);
                        setOrderForm((prev) => ({
                          ...prev,
                          shippingAddress: "",
                          phoneNumber: "",
                        }));
                      }}
                    >
                      <Text style={styles.selectedAddressRemove}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={orderForm.shippingAddress}
                  onChangeText={(text) => {
                    setSelectedAddressId(null);
                    setOrderForm((s) => ({ ...s, shippingAddress: text }));
                  }}
                  placeholder="Số 10 Hoàng Hoa Thám, Quận Tân Bình, TP.HCM"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={orderForm.phoneNumber}
                  onChangeText={(text) => {
                    setSelectedAddressId(null);
                    setOrderForm((s) => ({ ...s, phoneNumber: text }));
                  }}
                  placeholder="0941720502"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số lượng <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(orderForm.quantity)}
                  onChangeText={(text) =>
                    setOrderForm((s) => ({ ...s, quantity: Number(text) || 1 }))
                  }
                  placeholder="1"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Thời gian giao hàng mong muốn
                </Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDateTimePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#e11d48" />
                  <Text style={styles.dateTimeButtonText}>
                    {orderForm.deliveryDate
                      ? `${orderForm.deliveryDate.toLocaleDateString('vi-VN')} ${orderForm.deliveryDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                      : "Chọn ngày và giờ giao hàng"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <DateTimePickerModal
                isVisible={showDateTimePicker}
                mode="datetime"
                onConfirm={(date) => {
                  setOrderForm((prev) => ({
                    ...prev,
                    deliveryDate: date
                  }));
                  setShowDateTimePicker(false);
                }}
                onCancel={() => setShowDateTimePicker(false)}
                minimumDate={new Date()}
                locale="vi_VN"
                is24Hour={true}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={orderForm.note}
                  onChangeText={(text) =>
                    setOrderForm((s) => ({ ...s, note: text }))
                  }
                  placeholder="Giao hàng cẩn thận giúp tôi nhé..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorBox}>
                  <Feather name="x" size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setCurrentStep(1);
                    setSelectedExistingProduct(null);
                    setSelectedAddressId(null);
                  }}
                >
                  <Feather name="arrow-left" size={20} color="#e11d48" />
                  <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="cart"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.orderButtonText}>Đặt Hàng</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Flower Selection Modal */}
        <Modal visible={showFlowerModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn loại hoa</Text>
                <TouchableOpacity onPress={() => setShowFlowerModal(false)}>
                  <Feather name="x" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {products?.map((flower) => {
                  const flowerImages = parseImages(flower.images || "[]");
                  const firstImage = flowerImages[0];
                  const isSelected = form.flowerSelections.some(
                    (s) => s.childId === flower.id
                  );
                  return (
                    <TouchableOpacity
                      key={flower.id}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemSelected,
                      ]}
                      onPress={() =>
                        handleSelect("flower", {
                          id: flower.id,
                          name: flower.name,
                          images: flower.images,
                          price: flower.price,
                        })
                      }
                    >
                      <Image
                        source={{ uri: firstImage }}
                        style={styles.modalItemImage}
                      />
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemText}>{flower.name}</Text>
                        <Text style={styles.modalItemPrice}>
                          {formatVND(Number(flower.price))}/bông
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Feather name="check" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Item Selection Modal */}
        <Modal visible={showItemModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn phụ kiện</Text>
                <TouchableOpacity onPress={() => setShowItemModal(false)}>
                  <Feather name="x" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {items.map((item: any) => {
                  const itemImages = parseImages(item.images || "[]");
                  const firstImage =
                    itemImages[0] || "https://via.placeholder.com/40?text=Item";
                  const isSelected = form.itemSelections.some(
                    (s) => s.childId === item.id
                  );

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemSelected,
                      ]}
                      onPress={() =>
                        handleSelect("item", {
                          id: item.id,
                          name: item.name,
                          images: item.images,
                          price: item.price,
                        })
                      }
                    >
                      <Image
                        source={{ uri: firstImage }}
                        style={styles.modalItemImage}
                      />
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemText}>{item.name}</Text>
                        <Text style={styles.modalItemPrice}>
                          {item.price.toLocaleString("vi-VN")}đ
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Feather name="check" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Address Selection Modal */}
        <Modal visible={showAddressModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <Feather name="x" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {addresses.map((address: any) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressItem}
                    onPress={() => handleSelectAddress(address)}
                  >
                    <View style={styles.addressItemHeader}>
                      {selectedAddressId === address.id && (
                        <Feather
                          name="check"
                          size={20}
                          color="#e11d48"
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text style={styles.addressItemName}>
                        {address.recipientName}
                      </Text>
                      {address.default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.addressItemRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text style={styles.addressItemText}>
                        {address.address}
                      </Text>
                    </View>
                    <View style={styles.addressItemRow}>
                      <Feather name="phone" size={14} color="#6b7280" />
                      <Text style={styles.addressItemText}>
                        {address.phoneNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepItemActive: {
    backgroundColor: "#fff",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#e11d48",
  },
  stepNumber: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  stepTextActive: {
    color: "#e11d48",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#fef2f2",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#e11d48",
  },
  content: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  infoBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  required: {
    color: "#e11d48",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: -4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputInner: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    paddingVertical: 12,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  compositionSection: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#fecdd3",
    gap: 16,
  },
  selectorGroup: {
    gap: 8,
  },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff0f3",
    borderRadius: 8,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  selectionImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  selectionPrice: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  quantityInput: {
    width: 60,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fda4af",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "center",
    fontSize: 14,
    color: "#1f2937",
  },
  removeButton: {
    padding: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#991b1b",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e11d48",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  existingList: {
    gap: 12,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#fecdd3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e11d48",
  },
  productPreview: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#fecdd3",
  },
  productPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  productPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  productPreviewContent: {
    flexDirection: "row",
    gap: 16,
  },
  productPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  productPreviewInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productPreviewName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  productPreviewDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  productPreviewPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e11d48",
  },
  addressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  addressButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e11d48",
  },
  selectedAddressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#15803d",
  },
  selectedAddressRemove: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803d",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 12,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e11d48",
  },
  orderButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e11d48",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalItemSelected: {
    borderColor: "#e11d48",
    backgroundColor: "#fef2f2",
  },
  modalItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  modalItemPrice: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  addressItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  addressItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  defaultBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e11d48",
  },
  addressItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressItemText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 2,
    borderColor: "#e11d48",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e11d48",
  },
  imagePreviewContainer: {
    marginTop: 16,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compositionPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
  compositionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991b1b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  compositionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compositionBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compositionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#991b1b",
  },
});
