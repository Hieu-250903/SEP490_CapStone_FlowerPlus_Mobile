import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Bó hoa cẩm tú cầu Nàng Thơ',
    originalPrice: 350000,
    discountedPrice: 300000,
    discount: 14,
    label: 'HOT',
    labelColor: '#EF4444',
    image: 'https://flowersight.com/wp-content/uploads/2023/10/lang-hoa-hong-dep-tai-flowersight-min.jpg',
    category: 'Hoa Sinh Nhật'
  },
  {
    id: 2,
    name: 'Bó Hoa Hồng Sinh Nhật Giá Rẻ Đẹp',
    originalPrice: 350000,
    discountedPrice: 300000,
    discount: 14,
    label: null,
    image: 'https://hoahongsi.com/Upload/product/shimmer-5294.jpg',
    category: 'Hoa Hồng'
  },
  {
    id: 3,
    name: 'Bó Hoa Tú Cầu Kem Dâu',
    originalPrice: 350000,
    discountedPrice: 300000,
    discount: 14,
    label: 'New',
    labelColor: '#10B981',
    image: 'https://flowersight.com/wp-content/uploads/2024/07/bo-hoa-tulip-10-bong-2.jpg',
    category: 'Hoa Tulip'
  },
  {
    id: 4,
    name: 'Bó Hoa The Ivory Dream',
    originalPrice: 400000,
    discountedPrice: 330000,
    discount: 18,
    image: 'https://flowersight.com/wp-content/uploads/2023/10/lang-hoa-hong-dep-tai-flowersight-min.jpg',
    category: 'Hoa Sinh Nhật'
  },
  {
    id: 5,
    name: 'Shimmer iZi',
    originalPrice: 350000,
    discountedPrice: 320000,
    discount: 9,
    image: 'https://hoahongsi.com/Upload/product/shimmer-5294.jpg',
    category: 'Hoa Hồng'
  },
  {
    id: 6,
    name: 'Bó Hoa Sinh Nhật Cẩm Tú Cầu Moomi',
    originalPrice: 300000,
    discountedPrice: 235000,
    discount: 22,
    image: 'https://flowersight.com/wp-content/uploads/2024/07/bo-hoa-tulip-10-bong-2.jpg',
    category: 'Hoa Sinh Nhật'
  },
  {
    id: 7,
    name: 'Bó Hoa Hồng Đỏ Tình Yêu',
    originalPrice: 450000,
    discountedPrice: 380000,
    discount: 16,
    label: 'HOT',
    labelColor: '#EF4444',
    image: 'https://flowersight.com/wp-content/uploads/2023/10/lang-hoa-hong-dep-tai-flowersight-min.jpg',
    category: 'Hoa Hồng'
  },
  {
    id: 8,
    name: 'Bó Hoa Tulip Vàng Tươi',
    originalPrice: 320000,
    discountedPrice: 280000,
    discount: 13,
    label: 'New',
    labelColor: '#10B981',
    image: 'https://hoahongsi.com/Upload/product/shimmer-5294.jpg',
    category: 'Hoa Tulip'
  },
];

export const CATEGORIES = [
  { id: '1', name: 'Hoa Sinh Nhật', icon: '🎂' },
  { id: '2', name: 'Hoa Hồng', icon: '🌹' },
  { id: '3', name: 'Hoa Tulip', icon: '🌷' },
  { id: '4', name: 'Hoa Khai Trương', icon: '🎉' },
  { id: '5', name: 'Hoa Ly', icon: '💐' },
  { id: '6', name: 'Hoa Cúc', icon: '🌼' },
];