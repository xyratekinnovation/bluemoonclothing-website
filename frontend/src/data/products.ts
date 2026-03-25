import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: "men" | "women" | "kids";
  sizes: string[];
  description: string;
  details: string[];
  badge?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Essential White Tee",
    price: 1299,
    originalPrice: 1799,
    image: product1,
    images: [product1, product1],
    category: "men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Crafted from premium Supima cotton, this essential tee delivers unmatched softness and a refined fit that elevates your everyday style.",
    details: ["100% Supima Cotton", "Pre-shrunk fabric", "Reinforced collar", "Made in India"],
    badge: "Bestseller",
  },
  {
    id: "2",
    name: "Noir Tailored Blazer",
    price: 5999,
    image: product2,
    images: [product2, product2],
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    description: "A sharp, modern blazer cut from premium Italian wool blend. Perfect for occasions that demand quiet confidence.",
    details: ["Wool-polyester blend", "Slim fit", "Interior pockets", "Dry clean only"],
  },
  {
    id: "3",
    name: "Sand Chino Trousers",
    price: 2499,
    image: product3,
    images: [product3, product3],
    category: "men",
    sizes: ["28", "30", "32", "34", "36"],
    description: "Relaxed yet polished, these chinos are tailored from stretch cotton for all-day comfort with a clean silhouette.",
    details: ["98% Cotton, 2% Elastane", "Tapered fit", "Side pockets", "Machine washable"],
    badge: "New",
  },
  {
    id: "4",
    name: "Navy Classic Polo",
    price: 1799,
    image: product4,
    images: [product4, product4],
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Timeless polo crafted from breathable piqué cotton. A refined staple for effortless elegance.",
    details: ["100% Piqué Cotton", "Regular fit", "Two-button placket", "Ribbed collar"],
  },
  {
    id: "5",
    name: "Cloud Grey Hoodie",
    price: 2999,
    originalPrice: 3499,
    image: product5,
    images: [product5, product5],
    category: "women",
    sizes: ["S", "M", "L", "XL"],
    description: "Luxuriously soft French terry hoodie with a relaxed, oversized fit. Your new go-to for elevated comfort.",
    details: ["French terry cotton", "Oversized fit", "Kangaroo pocket", "Ribbed cuffs"],
    badge: "Sale",
  },
  {
    id: "6",
    name: "Pure Linen Shirt",
    price: 2199,
    image: product6,
    images: [product6, product6],
    category: "kids",
    sizes: ["4Y", "6Y", "8Y", "10Y", "12Y"],
    description: "Airy and elegant, this linen shirt brings resort-ready sophistication to your wardrobe.",
    details: ["100% European Linen", "Relaxed fit", "Mother-of-pearl buttons", "Breathable weave"],
  },
];
