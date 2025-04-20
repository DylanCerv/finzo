export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number; // Precio por unidad al momento de la venta
  total: number;
  date: string;
} 