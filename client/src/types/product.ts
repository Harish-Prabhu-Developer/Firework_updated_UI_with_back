export interface Product {
    id: string;
    name: string;
    content: string;
    price: number;
    discPrice: number;
    img: string;
  }
  
  export interface Category {
    name: string;
    products: Product[];
  }
