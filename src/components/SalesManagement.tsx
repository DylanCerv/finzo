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
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.price.toString().includes(searchTerm)
  );

  // Filtrar ventas del día actual
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return saleDate.getDate() === today.getDate() &&
           saleDate.getMonth() === today.getMonth() &&
           saleDate.getFullYear() === today.getFullYear();
  });

  // Calcular total de ventas del día
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  // Agrupar ventas por producto
  const groupedSales = todaySales.reduce((acc, sale) => {
    const existingProduct = acc.find(item => item.productId === sale.productId);
    
    if (existingProduct) {
      existingProduct.quantity += sale.quantity;
      existingProduct.total += sale.total;
    } else {
      acc.push({...sale});
    }
    
    return acc;
  }, [] as Sale[]);

  const calculateChange = (): number => {
    if (!paymentAmount || paymentAmount === '') return 0;
    const payment = parseFloat(paymentAmount);
    // Siempre restar el total del pago
    return payment - totalAmount;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const productId = parseInt(selectedProduct);
    const saleQuantity = parseInt(quantity);
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

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
      setPaymentAmount('');
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      alert('Error al guardar la venta');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddItem} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Buscar Producto</label>
            <input
              type="text"
              placeholder="Buscar por nombre o precio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Seleccionar Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Seleccionar producto</option>
              {filteredProducts.map(product => (
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
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Dinero Recibido:</td>
                  <td className="table-cell">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field w-full"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Vuelto:</td>
                  <td className={`table-cell font-bold text-lg ${calculateChange() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${calculateChange().toFixed(2)}
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ventas del Día</h3>
          <span className="text-lg font-bold text-gray-900">
            Total del día: ${todayTotal.toFixed(2)}
          </span>
        </div>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Producto</th>
                <th className="table-header">Cantidad</th>
                <th className="table-header">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedSales.map((sale) => {
                const product = products.find(p => p.id === sale.productId);
                return (
                  <tr key={sale.id}>
                    <td className="table-cell">
                      {product?.name || 'Producto eliminado'}
                    </td>
                    <td className="table-cell">{sale.quantity}</td>
                    <td className="table-cell">${sale.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                );
              })}
              {todaySales.length === 0 && (
                <tr>
                  <td colSpan={3} className="table-cell text-center text-gray-500">
                    No hay ventas registradas hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 