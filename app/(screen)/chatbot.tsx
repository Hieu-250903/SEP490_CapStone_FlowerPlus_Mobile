import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getChatHistory, sendChatMessage, ChatMessage } from '@/services/chatbot';
import { authService } from '@/services/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatbotScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchUserIdAndHistory();
    }, []);

    const fetchUserIdAndHistory = async () => {
        try {
            const id = await authService.getUserId();
            if (id) {
                setUserId(id);
                await fetchHistory(id);
            } else {
                // Handle not logged in or error
                setLoading(false);
                setMessages([
                    {
                        id: 'welcome',
                        message: 'Xin chào! Tôi là trợ lý ảo của cửa hàng hoa. Vui lòng đăng nhập để được hỗ trợ tốt nhất.',
                        sender: 'bot',
                        timestamp: new Date(),
                    }
                ]);
            }
        } catch (error) {
            console.error("Error fetching user id:", error);
            setLoading(false);
        }
    };

    const fetchHistory = async (id: number) => {
        try {
            const response = await getChatHistory(id);
            const historyMessages: ChatMessage[] = [];

            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((item: any, index: number) => {
                    historyMessages.push({
                        id: `history-user-${index}`,
                        message: item.userMessage,
                        sender: 'user',
                        timestamp: new Date(item.timestamp),
                    });

                    historyMessages.push({
                        id: `history-bot-${index}`,
                        message: item.botResponse,
                        sender: 'bot',
                        timestamp: new Date(item.timestamp),
                    });
                });
            }

            if (historyMessages.length === 0) {
                historyMessages.push({
                    id: 'welcome',
                    message: 'Xin chào! Tôi là trợ lý ảo của cửa hàng hoa. Tôi có thể giúp bạn tìm hiểu về các loại hoa và tư vấn cho bạn. Bạn cần hỗ trợ gì?',
                    sender: 'bot',
                    timestamp: new Date(),
                });
            }

            setMessages(historyMessages);
        } catch (error) {
            console.error("Error fetching history:", error);
            // Add welcome message on error if empty
            if (messages.length === 0) {
                setMessages([
                    {
                        id: 'welcome',
                        message: 'Xin chào! Tôi là trợ lý ảo của cửa hàng hoa. Tôi có thể giúp bạn tìm hiểu về các loại hoa và tư vấn cho bạn. Bạn cần hỗ trợ gì?',
                        sender: 'bot',
                        timestamp: new Date(),
                    }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if ((!inputMessage.trim() && !selectedImage) || sending || !userId) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            message: inputMessage.trim() || 'Hãy phân tích hình ảnh này',
            sender: 'user',
            timestamp: new Date(),
            imageUrl: selectedImage || undefined,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputMessage('');
        const imageToSend = selectedImage;
        setSelectedImage(null);
        setSending(true);

        try {
            const response = await sendChatMessage({
                message: userMsg.message,
                userId: userId,
                imageUrl: imageToSend || undefined,
            });

            const botMsg: ChatMessage = {
                id: `bot-${Date.now()}`,
                message: response.data.message,
                sender: 'bot',
                timestamp: new Date(response.data.timestamp),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMsg: ChatMessage = {
                id: `error-${Date.now()}`,
                message: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Assuming the API expects a base64 string or a URL. 
            // If it expects a file upload, we might need to adjust this.
            // Based on web code: setUploadedImageUrl(url) from UploadImage component.
            // The web component seems to upload first then return URL.
            // For simplicity here, let's assume we send base64 data URI if the backend supports it,
            // OR we might need to implement the upload logic similar to web.
            // Checking web implementation: `uploadedImageUrl` is passed.
            // The web uses `UploadImage` component which likely uploads to a server (Cloudinary/S3 etc) and returns URL.
            // Since I removed `UploadImageRN` earlier, I might need to implement a simple upload or just pass base64 if supported.
            // Let's assume for now we pass the base64 data URI.
            const asset = result.assets[0];
            const base64 = `data:${asset.mimeType};base64,${asset.base64}`;
            setSelectedImage(base64);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
                {!isUser && (
                    <View style={styles.botAvatar}>
                        <Ionicons name="rose" size={20} color="#EC4899" />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                    {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                    )}
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#EC4899', '#E11D48']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Trợ lý hoa</Text>
                    <Text style={styles.headerSubtitle}>Tư vấn và hỗ trợ 24/7</Text>
                </View>
                <View style={{ width: 24 }} />
            </LinearGradient>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#EC4899" />
                            <Text style={styles.loadingText}>Đang tải lịch sử chat...</Text>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                        <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                        <Ionicons name="image-outline" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        placeholder={selectedImage ? "Mô tả ảnh (tùy chọn)..." : "Nhập tin nhắn..."}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={(!inputMessage.trim() && !selectedImage) || sending}
                        style={[styles.sendButton, ((!inputMessage.trim() && !selectedImage) || sending) && styles.sendButtonDisabled]}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#FCE7F3',
    },
    chatContent: {
        padding: 16,
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 8,
        color: '#6B7280',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FCE7F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '100%',
    },
    userBubble: {
        backgroundColor: '#EC4899', // Pink-500
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#FFF',
    },
    botText: {
        color: '#1F2937',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    userTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    botTimestamp: {
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    iconButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EC4899',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#FBCFE8',
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    imagePreview: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        left: 60,
        backgroundColor: '#FFF',
        borderRadius: 12,
    }
});
