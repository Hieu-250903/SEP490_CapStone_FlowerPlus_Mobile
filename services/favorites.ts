import instance from "@/config/instance";

export interface FavoriteProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    image: string;
    images: string;
    stock: number;
    active: boolean;
    categories?: Array<{
        id: number;
        name: string;
    }>;
}

export interface FavoritesResponse {
    success: boolean;
    message: string;
    data: {
        listObjects: FavoriteProduct[];
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface ToggleFavoriteResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface CheckFavoriteResponse {
    success: boolean;
    message: string;
    data: boolean;
}

export const toggleFavorite = async (
    productId: number
): Promise<any> => {
    try {
        const response = await instance.post("/favorites/toggle", {
            productId,
        });
        return response;
    } catch (error: any) {
    }
};

export const checkFavoriteStatus = async (
    productId: number
): Promise<any> => {
    try {
        const response = await instance.get(
            `/favorites/check/${productId}`
        );
        console.log("Check favorite response:", response);
        return response;
    } catch (error: any) {
        console.error("Error checking favorite status:", error);
        return { success: false, data: false };
    }
};

export const getFavoriteProducts = async (
    pageNumber: number = 0,
    pageSize: number = 10
): Promise<any> => {
    try {
        const response = await instance.get("/favorites", {
            params: {
                pageNumber,
                pageSize,
            },
        });
        return response;
    } catch (error: any) {
    }
};


export const getFavoriteCount = async (
    productId: number
): Promise<any> => {
    try {
        const response = await instance.get(
            `/favorites/count/${productId}`
        );
        return response;
    } catch (error: any) {
    }
};
