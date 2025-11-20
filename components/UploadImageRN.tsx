import { uploadFile } from '@/services/upload';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type UploadItem = {
  id: string;
  file?: any;
  url?: string;
  preview?: string;
  progress?: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
};

type Props = {
  multiple?: boolean;
  endpoint?: string;
  onChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
  maxFiles?: number;
};

export default function UploadImageRN({
  multiple = false,
  endpoint = '/files/upload',
  onChange,
  defaultValue,
  maxFiles,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>(() => {
    if (!defaultValue) return [];
    const urls = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    return urls.map((u) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: u,
      preview: u,
      status: 'done' as const,
      progress: 100,
    }));
  });
  const [busy, setBusy] = useState(false);

  const currentUrls = items.filter((i) => i.url).map((i) => i.url!);
  const prevUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!onChange) return;

    const urlsString = JSON.stringify(currentUrls);
    const prevUrlsString = JSON.stringify(prevUrlsRef.current);

    if (urlsString !== prevUrlsString) {
      prevUrlsRef.current = currentUrls;
      if (multiple) {
        onChange(currentUrls);
      } else {
        onChange(currentUrls[0] ?? '');
      }
    }
  }, [currentUrls, multiple, onChange]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để tải ảnh lên!');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: multiple,
        quality: 0.8,
        allowsEditing: !multiple,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        let assets = result.assets;

        if (maxFiles) {
          const canTake = maxFiles - items.length;
          if (canTake <= 0) {
            Alert.alert('Giới hạn', `Chỉ có thể tải lên tối đa ${maxFiles} ảnh`);
            return;
          }
          assets = assets.slice(0, canTake);
        }

        const newItems: UploadItem[] = assets.map((asset) => ({
          id: Math.random().toString(36).substr(2, 9),
          file: asset,
          preview: asset.uri,
          progress: 0,
          status: 'idle',
        }));

        setItems((prev) => (multiple ? [...prev, ...newItems] : newItems));
        setBusy(true);
        try {
          for (const it of newItems) {
            await uploadOne(it);
          }
        } finally {
          setBusy(false);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const uploadOne = async (item: UploadItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i
      )
    );

    try {
      const fileUri = item.file.uri;
      const filename = fileUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id && i.progress && i.progress < 90
              ? { ...i, progress: i.progress + 10 }
              : i
          )
        );
      }, 200);

      const res = await uploadFile({
        uri: fileUri,
        name: filename,
        type: type,
      });

      clearInterval(progressInterval);

      const imageUrl = res?.data?.url || res?.data;
      if (imageUrl) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, url: imageUrl, status: 'done', progress: 100 }
              : i
          )
        );
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'error', error: 'Upload thất bại' }
            : i
        )
      );
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={pickImages}
        disabled={busy}
      >
        <View style={styles.uploadContent}>
          {busy ? (
            <ActivityIndicator color="#e11d48" size="large" />
          ) : (
            <>
              <Feather name="upload" size={32} color="#e11d48" />
              <Text style={styles.uploadTitle}>
                {multiple ? 'Chọn nhiều ảnh' : 'Chọn 1 ảnh'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {busy ? 'Đang tải lên...' : 'Nhấn để chọn từ thư viện'}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewContainer}
          contentContainerStyle={styles.previewContent}
        >
          {items.map((it) => (
            <View key={it.id} style={styles.previewItem}>
              {it.preview ? (
                <Image
                  source={{ uri: it.preview }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <MaterialCommunityIcons name="image-outline" size={32} color="#9ca3af" />
                </View>
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(it.id)}
              >
                <Feather name="x" size={16} color="#fff" />
              </TouchableOpacity>

              {it.status === 'uploading' && (
                <View style={styles.progressOverlay}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${it.progress ?? 30}%` },
                      ]}
                    />
                  </View>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}

              {it.status === 'error' && (
                <View style={styles.errorOverlay}>
                  <Text style={styles.errorText}>{it.error || 'Lỗi'}</Text>
                </View>
              )}

              {it.status === 'done' && (
                <View style={styles.successBadge}>
                  <Text style={styles.successText}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fecdd3',
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    padding: 24,
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewContainer: {
    maxHeight: 150,
  },
  previewContent: {
    gap: 12,
    paddingVertical: 4,
  },
  previewItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    padding: 8,
  },
  errorText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  successBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
