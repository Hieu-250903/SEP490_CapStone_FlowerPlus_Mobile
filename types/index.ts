export interface Product {
  id: number;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  label?: string | null;
  labelColor?: string;
  image: string;
  description?: string;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  children?: string[];
}
