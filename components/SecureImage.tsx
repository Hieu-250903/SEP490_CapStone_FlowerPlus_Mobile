import React from "react";
import { Image, ImageProps, ImageStyle, StyleProp } from "react-native";
import { forceHttps } from "@/utils/imageUtils";

interface SecureImageProps extends Omit<ImageProps, "source"> {
    uri: string | null | undefined;
    fallback?: string;
    style?: StyleProp<ImageStyle>;
}

/**
 * Image component that automatically converts http:// URLs to https://
 * Use this instead of React Native's Image when displaying images from backend
 */
export default function SecureImage({
    uri,
    fallback = "https://via.placeholder.com/400",
    style,
    ...props
}: SecureImageProps) {
    const secureUri = uri ? forceHttps(uri) : fallback;

    return (
        <Image
            source={{ uri: secureUri }}
            style={style}
            {...props}
        />
    );
}
