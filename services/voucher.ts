import instance from "../config/instance";

export interface Voucher {
    id: number;
    code: string;
    type: "FIXED" | "PERCENTAGE";
    percent?: number;
    amount?: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    startsAt: string;
    endsAt: string;
    usageLimit: number;
    usedCount: number;
    applyAllProducts: boolean;
    productIds: number[];
    status: "ACTIVE" | "USED" | "EXPIRED" | "NOT_STARTED";
}

export interface VoucherValidationResult {
    valid: boolean;
    voucher?: Voucher;
    discountAmount?: number;
    message?: string;
}

export const getVouchers = async (): Promise<Voucher[]> => {
    try {
        const response = await instance.get("/vouchers");
        return response.data || [];
    } catch (error: any) {
        console.error("Error fetching vouchers:", error);
        throw error;
    }
};

export const validateVoucher = async (
    code: string,
    orderTotal: number,
    productIds: number[]
): Promise<VoucherValidationResult> => {
    try {
        const vouchers = await getVouchers();
        const voucher = vouchers.find((v) => v.code === code);

        if (!voucher) {
            return {
                valid: false,
                message: "Mã voucher không tồn tại",
            };
        }
        const now = new Date();
        const startsAt = new Date(voucher.startsAt);
        const endsAt = new Date(voucher.endsAt);

        if (now < startsAt) {
            return {
                valid: false,
                message: "Mã voucher chưa có hiệu lực",
            };
        }

        if (now > endsAt) {
            return {
                valid: false,
                message: "Mã voucher đã hết hạn",
            };
        }

        if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
            return {
                valid: false,
                message: "Mã voucher đã hết lượt sử dụng",
            };
        }

        if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
            return {
                valid: false,
                message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
            };
        }
        if (!voucher.applyAllProducts) {
            const hasApplicableProduct = productIds.some((id) =>
                voucher.productIds.includes(id)
            );
            if (!hasApplicableProduct) {
                return {
                    valid: false,
                    message: "Mã voucher không áp dụng cho sản phẩm này",
                };
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.type === "FIXED") {
            discountAmount = voucher.amount || 0;
        } else if (voucher.type === "PERCENTAGE") {
            discountAmount = orderTotal * ((voucher.percent || 0) / 100);
            if (voucher.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
            }
        }

        // Ensure discount doesn't exceed order total
        discountAmount = Math.min(discountAmount, orderTotal);

        return {
            valid: true,
            voucher,
            discountAmount,
            message: "Mã voucher hợp lệ",
        };
    } catch (error: any) {
        console.error("Error validating voucher:", error);
        return {
            valid: false,
            message: "Không thể xác thực mã voucher",
        };
    }
};

export const calculateDiscount = (
    voucher: Voucher,
    orderTotal: number
): number => {
    let discount = 0;

    if (voucher.type === "FIXED") {
        discount = voucher.amount || 0;
    } else if (voucher.type === "PERCENTAGE") {
        discount = orderTotal * ((voucher.percent || 0) / 100);
        if (voucher.maxDiscountAmount) {
            discount = Math.min(discount, voucher.maxDiscountAmount);
        }
    }

    return Math.min(discount, orderTotal);
};
