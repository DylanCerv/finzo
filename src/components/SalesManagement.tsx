import { useState } from 'react';
import { dataService } from '../services/dataService';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  priceHistory: {
    price: number;
    date: string;
  }[];
}

interface SaleItem {
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  total: number;
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
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const productId = parseInt(selectedProduct);
    const saleQuantity = parseInt(quantity);
    
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < saleQuantity) {
      alert('No hay suficiente stock disponible');
      return;
    }

    const newItem: SaleItem = {
      productId,
      quantity: saleQuantity,
      price: product.price,
      total: product.price * saleQuantity
    };

    setCurrentSaleItems([...currentSaleItems, newItem]);
    setTotalAmount(prev => prev + newItem.total);
    setSelectedProduct('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = currentSaleItems[index];
    setCurrentSaleItems(currentSaleItems.filter((_, i) => i !== index));
    setTotalAmount(prev => prev - removedItem.total);
  };

  const handleSaveTransaction = async () => {
    if (currentSaleItems.length === 0) return;

    try {
      // Create new sales records
      const newSales = currentSaleItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          id: Date.now() + Math.random(), // Ensure unique ID
          productId: item.productId,
          productName: product?.name || 'Producto eliminado',
          quantity: item.quantity,
          unitPrice: item.price, // Guardamos el precio unitario
          total: item.total,
          date: new Date().toISOString()
        };
      });

      // Update product stock
      const updatedProducts = products.map(product => {
        const saleItem = currentSaleItems.find(item => item.productId === product.id);
        if (saleItem) {
          return {
            ...product,
            stock: product.stock - saleItem.quantity
          };
        }
        return product;
      });

      // Save everything
      await dataService.saveProducts(updatedProducts);
      await dataService.saveSales([...sales, ...newSales]);

      // Update state
      setProducts(updatedProducts);
      setSales([...sales, ...newSales]);

      // Reset form
      setCurrentSaleItems([]);
      setTotalAmount(0);
      setSelectedProduct('');
      setQuantity('');
      
      alert('Venta registrada exitosamente');
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      alert('Error al guardar la venta');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddItem} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Seleccionar producto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-field"
              required
              min="1"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Agregar
            </button>
          </div>
        </div>
      </form>

      {currentSaleItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Detalle de la Venta</h3>
          <div className="table-container">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Producto</th>
                  <th className="table-header">Cantidad</th>
                  <th className="table-header">Precio Unit.</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSaleItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <tr key={index}>
                      <td className="table-cell">
                        {product?.name || 'Producto eliminado'}
                      </td>
                      <td className="table-cell">{item.quantity}</td>
                      <td className="table-cell">${item.price.toFixed(2)}</td>
                      <td className="table-cell">${item.total.toFixed(2)}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="btn-danger"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Total a Pagar:</td>
                  <td className="table-cell font-bold text-lg">
                    ${totalAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveTransaction}
              className="btn-primary"
            >
              Guardar Registro
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas Recientes</h3>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Producto</th>
                <th className="table-header">Cantidad</th>
                <th className="table-header">Total</th>
                <th className="table-header">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.slice().reverse().map((sale) => {
                const product = products.find(p => p.id === sale.productId);
                return (
                  <tr key={sale.id}>
                    <td className="table-cell">
                      {product?.name || 'Producto eliminado'}
                    </td>
                    <td className="table-cell">{sale.quantity}</td>
                    <td className="table-cell">${sale.total?.toFixed(2) || '0.00'}</td>
                    <td className="table-cell">
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