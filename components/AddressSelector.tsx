import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchProvinces, fetchProvinceDetails } from "@/services/address-api";
import { Province, District, Ward } from "@/types";

interface AddressSelectorProps {
    onProvinceChange: (code: number | null, name: string) => void;
    onDistrictChange: (code: number | null, name: string) => void;
    onWardChange: (code: number | null, name: string) => void;
    disabled?: boolean;
    initialProvince?: number | null;
    initialDistrict?: number | null;
    initialWard?: number | null;
}

export default function AddressSelector({
    onProvinceChange,
    onDistrictChange,
    onWardChange,
    disabled = false,
    initialProvince = null,
    initialDistrict = null,
    initialWard = null,
}: AddressSelectorProps) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<number | null>(
        initialProvince
    );
    const [selectedDistrict, setSelectedDistrict] = useState<number | null>(
        initialDistrict
    );
    const [selectedWard, setSelectedWard] = useState<number | null>(initialWard);

    const [provincesLoading, setProvincesLoading] = useState(false);
    const [provinceDetailsLoading, setProvinceDetailsLoading] = useState(false);

    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWardModal, setShowWardModal] = useState(false);

    // Fetch provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            setProvincesLoading(true);
            try {
                const data = await fetchProvinces();
                setProvinces(data);
            } catch (error) {
                console.error("Error loading provinces:", error);
            } finally {
                setProvincesLoading(false);
            }
        };
        loadProvinces();
    }, []);

    // Fetch province details when province is selected
    useEffect(() => {
        const loadProvinceDetails = async () => {
            if (!selectedProvince) {
                setDistricts([]);
                setWards([]);
                return;
            }

            setProvinceDetailsLoading(true);
            try {
                const data = await fetchProvinceDetails(selectedProvince);
                setDistricts(data.districts || []);
            } catch (error) {
                console.error("Error loading province details:", error);
            } finally {
                setProvinceDetailsLoading(false);
            }
        };
        loadProvinceDetails();
    }, [selectedProvince]);

    // Update wards when district changes
    useEffect(() => {
        if (!selectedDistrict || districts.length === 0) {
            setWards([]);
            return;
        }

        const district = districts.find((d) => d.code === selectedDistrict);
        setWards(district?.wards || []);
    }, [selectedDistrict, districts]);

    // Reset district and ward when province changes
    useEffect(() => {
        if (selectedProvince !== initialProvince) {
            setSelectedDistrict(null);
            setSelectedWard(null);
            onDistrictChange(null, "");
            onWardChange(null, "");
        }
    }, [selectedProvince]);

    // Reset ward when district changes
    useEffect(() => {
        if (selectedDistrict !== initialDistrict) {
            setSelectedWard(null);
            onWardChange(null, "");
        }
    }, [selectedDistrict]);

    const handleProvinceSelect = (province: Province) => {
        setSelectedProvince(province.code);
        onProvinceChange(province.code, province.name);
        setShowProvinceModal(false);
    };

    const handleDistrictSelect = (district: District) => {
        setSelectedDistrict(district.code);
        onDistrictChange(district.code, district.name);
        setShowDistrictModal(false);
    };

    const handleWardSelect = (ward: Ward) => {
        setSelectedWard(ward.code);
        onWardChange(ward.code, ward.name);
        setShowWardModal(false);
    };

    const getSelectedProvinceName = () => {
        return provinces.find((p) => p.code === selectedProvince)?.name || "";
    };

    const getSelectedDistrictName = () => {
        return districts.find((d) => d.code === selectedDistrict)?.name || "";
    };

    const getSelectedWardName = () => {
        return wards.find((w) => w.code === selectedWard)?.name || "";
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        items: { code: number; name: string }[],
        onSelect: (item: any) => void,
        loading: boolean,
        placeholder: string
    ) => (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalList}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#BE123C" />
                                <Text style={styles.loadingText}>Đang tải...</Text>
                            </View>
                        ) : items.length > 0 ? (
                            items.map((item) => (
                                <TouchableOpacity
                                    key={item.code}
                                    style={styles.modalItem}
                                    onPress={() => onSelect(item)}
                                >
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{placeholder}</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Province Selector */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Tỉnh/Thành phố *</Text>
                <TouchableOpacity
                    style={[styles.input, disabled && styles.inputDisabled]}
                    onPress={() => !disabled && setShowProvinceModal(true)}
                    disabled={disabled}
                >
                    <Text
                        style={[
                            styles.inputText,
                            !getSelectedProvinceName() && styles.placeholder,
                        ]}
                    >
                        {provincesLoading
                            ? "Đang tải..."
                            : getSelectedProvinceName() || "Chọn tỉnh/thành phố"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* District Selector */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Quận/Huyện *</Text>
                <TouchableOpacity
                    style={[
                        styles.input,
                        (!selectedProvince || disabled) && styles.inputDisabled,
                    ]}
                    onPress={() => selectedProvince && !disabled && setShowDistrictModal(true)}
                    disabled={!selectedProvince || disabled}
                >
                    <Text
                        style={[
                            styles.inputText,
                            !getSelectedDistrictName() && styles.placeholder,
                        ]}
                    >
                        {!selectedProvince
                            ? "Chọn tỉnh/thành phố trước"
                            : provinceDetailsLoading
                                ? "Đang tải..."
                                : getSelectedDistrictName() || "Chọn quận/huyện"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Ward Selector */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Phường/Xã *</Text>
                <TouchableOpacity
                    style={[
                        styles.input,
                        (!selectedDistrict || disabled) && styles.inputDisabled,
                    ]}
                    onPress={() => selectedDistrict && !disabled && setShowWardModal(true)}
                    disabled={!selectedDistrict || disabled}
                >
                    <Text
                        style={[
                            styles.inputText,
                            !getSelectedWardName() && styles.placeholder,
                        ]}
                    >
                        {!selectedDistrict
                            ? "Chọn quận/huyện trước"
                            : getSelectedWardName() || "Chọn phường/xã"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {renderPickerModal(
                showProvinceModal,
                () => setShowProvinceModal(false),
                "Chọn Tỉnh/Thành phố",
                provinces,
                handleProvinceSelect,
                provincesLoading,
                "Không có dữ liệu"
            )}

            {renderPickerModal(
                showDistrictModal,
                () => setShowDistrictModal(false),
                "Chọn Quận/Huyện",
                districts,
                handleDistrictSelect,
                provinceDetailsLoading,
                "Vui lòng chọn tỉnh/thành phố trước"
            )}

            {renderPickerModal(
                showWardModal,
                () => setShowWardModal(false),
                "Chọn Phường/Xã",
                wards,
                handleWardSelect,
                false,
                "Vui lòng chọn quận/huyện trước"
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 8,
    },
    input: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    inputDisabled: {
        backgroundColor: "#F3F4F6",
        opacity: 0.6,
    },
    inputText: {
        fontSize: 14,
        color: "#1F2937",
        flex: 1,
    },
    placeholder: {
        color: "#9CA3AF",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1F2937",
    },
    modalList: {
        maxHeight: 400,
    },
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalItemText: {
        fontSize: 15,
        color: "#1F2937",
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
    },
});
