export const getProductImage = (
  imageData: string | null | undefined
): string => {
  try {
    if (!imageData) {
      return "https://via.placeholder.com/400";
    }

    if (imageData.startsWith("[")) {
      const imageArray = JSON.parse(imageData);
      return imageArray[0] || "https://via.placeholder.com/400";
    }

    return imageData;
  } catch (error) {
    console.log("Error parsing image:", error);
    return "https://via.placeholder.com/400";
  }
};

export const getAllProductImages = (
  imageData: string | null | undefined
): string[] => {
  try {
    if (!imageData) {
      return ["https://via.placeholder.com/400"];
    }

    if (imageData.startsWith("[")) {
      const imageArray = JSON.parse(imageData);
      return imageArray.length > 0
        ? imageArray
        : ["https://via.placeholder.com/400"];
    }

    return [imageData];
  } catch (error) {
    console.log("Error parsing images:", error);
    return ["https://via.placeholder.com/400"];
  }
};

export const formatVND = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};
