// Convert http:// to https:// for secure image loading
export const forceHttps = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

export const getProductImage = (
  imageData: string | null | undefined
): string => {
  try {
    if (!imageData) {
      return "https://via.placeholder.com/400";
    }

    let imageUrl: string;
    if (imageData.startsWith("[")) {
      const imageArray = JSON.parse(imageData);
      imageUrl = imageArray[0] || "https://via.placeholder.com/400";
    } else {
      imageUrl = imageData;
    }

    return forceHttps(imageUrl);
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

    let images: string[];
    if (imageData.startsWith("[")) {
      const imageArray = JSON.parse(imageData);
      images = imageArray.length > 0
        ? imageArray
        : ["https://via.placeholder.com/400"];
    } else {
      images = [imageData];
    }

    return images.map(forceHttps);
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

