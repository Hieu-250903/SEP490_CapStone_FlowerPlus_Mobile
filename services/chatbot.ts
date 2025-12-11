import instance from "@/config/instance";

export interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    imageUrl?: string;
}

export interface SendMessageRequest {
    message: string;
    userId: number;
    imageUrl?: string;
}

export const getChatHistory = async (userId: number) => {
    try {
        const response = await instance.get(`/chatbot/chat-history?userId=${userId}`);
        return response;
    } catch (error) {
        console.error("Error fetching chat history:", error);
        throw error;
    }
};

export const sendChatMessage = async (data: SendMessageRequest) => {
    try {
        const response = await instance.post("/chatbot/send-message", data);
        return response;
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw error;
    }
};
