import instance from "@/config/instance";

export const getPersonalizedRecommendations = async (limit: number = 10) => {
    try {
        const response = await instance.get(
            `/recommendations/personalized?limit=${limit}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};
