import instance from "@/config/instance";

export const uploadFile = async (file: {
  uri: string;
  type?: string;
  name?: string;
}) => {
  try {
    const formData = new FormData();
    const fileToUpload: any = {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: file.name || `upload_${Date.now()}.jpg`,
    };

    formData.append("file", fileToUpload);

    const response = await instance.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
export const uploadMultipleFiles = async (
  files: Array<{
    uri: string;
    type?: string;
    name?: string;
  }>
) => {
  try {
    const uploadPromises = files.map((file) => uploadFile(file));
    const responses = await Promise.all(uploadPromises);
    return responses.map((res) => res.data);
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};

export const uploadImage = async (imageUri: string) => {
  try {
    const filename = imageUri.split("/").pop() || `image_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    return await uploadFile({
      uri: imageUri,
      type,
      name: filename,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadImages = async (imageUris: string[]) => {
  try {
    const files = imageUris.map((uri) => {
      const filename = uri.split("/").pop() || `image_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      return {
        uri,
        type,
        name: filename,
      };
    });

    return await uploadMultipleFiles(files);
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
};

export default {
  uploadFile,
  uploadMultipleFiles,
  uploadImage,
  uploadImages,
};
