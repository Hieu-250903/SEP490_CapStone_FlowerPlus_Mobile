import instance from "@/config/instance";

export interface CreateAddressRequest {
    id?: number;
    userId?: number;
    address: string;
    recipientName: string;
    phoneNumber: string;
    province: string;
    district: string;
    ward: string;
    default: boolean;
}

export interface AddressResponse {
    success: boolean;
    message: string;
    data: any;
}

export const createOrUpdateAddress = async (
    data: CreateAddressRequest
): Promise<any> => {
    try {
        console.log("data", data)
        const response = await instance.post("/auth/create-update-address", data);
        console.log("response", response)
        return response;
    } catch (error: any) {
        throw error;
    }
};
