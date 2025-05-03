export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number; // Precio por unidad al momento de la venta
  total: number;
  date: string;
  title?: string; // Título de la venta (ej. Mesa 1, Cliente Juan, etc.)
  group_id?: string; // ID de la venta pendiente de origen (si aplica)
} 