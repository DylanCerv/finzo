import { useState } from 'react';
import { dataService } from '../services/dataService';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface Sale {
  id: number;
  productId: number;
  quantity: number;
  date: string;
}

interface SalesManagementProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
}

export default function SalesManagement({ products, setProducts, sales, setSales }: SalesManagementProps) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const productId = parseInt(selectedProduct);
    const saleQuantity = parseInt(quantity);
    
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < saleQuantity) {
      alert('No hay suficiente stock disponible');
      return;
    }

    const sale: Sale = {
      id: Date.now(),
      productId,
      quantity: saleQuantity,
      date: new Date().toISOString()
    };

    // Update product stock
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock - saleQuantity } : p
    );

    const updatedSales = [...sales, sale];

    // Save both products and sales
    await Promise.all([
      dataService.saveProducts(updatedProducts),
      dataService.saveSales(updatedSales)
    ]);

    setProducts(updatedProducts);
    setSales(updatedSales);
    setSelectedProduct('');
    setQuantity('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddSale} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Producto</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar producto</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - Stock: {product.stock}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            min="1"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Registrar Venta
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas Recientes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.slice().reverse().map((sale) => {
                const product = products.find(p => p.id === sale.productId);
                return (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product?.name || 'Producto eliminado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 