import { useState, useEffect } from 'react';
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
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export default function SalesRegister() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const productList = await dataService.getProducts();
    setProducts(productList);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.price.toString().includes(searchTerm)
  );

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return;

    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      quantity: parseInt(quantity),
      price: product.price,
      total: product.price * parseInt(quantity)
    };

    setSaleItems([...saleItems, newItem]);
    setTotalAmount(prev => prev + newItem.total);
    setSelectedProduct('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = saleItems[index];
    setSaleItems(saleItems.filter((_, i) => i !== index));
    setTotalAmount(prev => prev - removedItem.total);
  };

  const handleSaveTransaction = async () => {
    if (saleItems.length === 0) return;

    try {
      // Get current sales
      const currentSales = await dataService.getSales();
      
      // Create new sales records
      const newSales = saleItems.map(item => ({
        id: Date.now() + Math.random(), // Ensure unique ID
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        total: item.total,
        date: new Date().toISOString()
      }));

      // Update product stock
      const updatedProducts = products.map(product => {
        const saleItem = saleItems.find(item => item.productId === product.id);
        if (saleItem) {
          return {
            ...product,
            stock: product.stock - saleItem.quantity
          };
        }
        return product;
      });

      // Save everything
      await dataService.saveSales([...currentSales, ...newSales]);
      await dataService.saveProducts(updatedProducts);

      // Reset form
      setSaleItems([]);
      setTotalAmount(0);
      setSelectedProduct('');
      setQuantity('');
      loadProducts(); // Reload products to update stock
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      alert('Error al guardar la venta');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Registro de Ventas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Buscar Producto</label>
          <input
            type="text"
            placeholder="Buscar por nombre o precio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Seleccionar Producto</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddItem}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Agregar
          </button>
        </div>
      </div>

      {saleItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Detalle de la Venta</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {saleItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Total a Pagar:</td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
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
              className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Guardar Registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 