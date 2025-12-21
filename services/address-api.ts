import { Province } from "@/types";

const API_BASE = "https://provinces.open-api.vn/api/v1";

/**
 * Fetch all provinces/cities in Vietnam
 */
export const fetchProvinces = async (): Promise<Province[]> => {
    try {
        const response = await fetch(`${API_BASE}/`);
        if (!response.ok) {
            throw new Error("Failed to fetch provinces");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching provinces:", error);
        throw error;
    }
};

/**
 * Fetch detailed information for a specific province including districts and wards
 * @param provinceCode - The code of the province
 */
export const fetchProvinceDetails = async (
    provinceCode: number
): Promise<Province> => {
    try {
        const response = await fetch(`${API_BASE}/p/${provinceCode}?depth=3`);
        if (!response.ok) {
            throw new Error("Failed to fetch province details");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching province details:", error);
        throw error;
    }
};
