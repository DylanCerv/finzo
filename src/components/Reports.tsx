import { useState, useEffect } from 'react';

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

interface Sale {
  id: number;
  productId: number;
  quantity: number;
  date: string;
}

interface ReportsProps {
  products: Product[];
  sales: Sale[];
}

export default function Reports({ products, sales }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'general'>('daily');

  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch (selectedPeriod) {
        case 'daily':
          return saleDate >= today;
        case 'weekly':
          return saleDate >= weekAgo;
        case 'general':
          return true;
      }
    });
  };

  // Función para obtener el precio histórico de un producto en una fecha específica
  const getHistoricalPrice = (product: Product, saleDate: string) => {
    const saleDateTime = new Date(saleDate).getTime();
    
    // Si no hay historial de precios o está vacío, usar el precio actual
    if (!product.priceHistory || product.priceHistory.length === 0) {
      return product.price;
    }

    // Ordenar el historial de precios por fecha, del más reciente al más antiguo
    const sortedHistory = [...product.priceHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Encontrar el precio que estaba vigente en la fecha de la venta
    for (const history of sortedHistory) {
      if (new Date(history.date).getTime() <= saleDateTime) {
        return history.price;
      }
    }

    // Si la venta es más antigua que todo el historial, usar el precio más antiguo
    return sortedHistory[sortedHistory.length - 1].price;
  };

  const calculateTotalSales = () => {
    const filteredSales = getFilteredSales();
    return filteredSales.reduce((total, sale) => {
      const product = products.find(p => p.id === sale.productId);
      if (!product) return total;
      
      const historicalPrice = getHistoricalPrice(product, sale.date);
      return total + (historicalPrice * sale.quantity);
    }, 0);
  };

  const getTopProducts = () => {
    const filteredSales = getFilteredSales();
    const productSales = new Map<number, { 
      quantity: number; 
      revenue: number; 
      lastSaleDate: string;
      sales: { date: string; quantity: number; price: number }[];
    }>();

    filteredSales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        const historicalPrice = getHistoricalPrice(product, sale.date);
        const current = productSales.get(sale.productId) || { 
          quantity: 0, 
          revenue: 0, 
          lastSaleDate: sale.date,
          sales: []
        };

        productSales.set(sale.productId, {
          quantity: current.quantity + sale.quantity,
          revenue: current.revenue + (historicalPrice * sale.quantity),
          lastSaleDate: sale.date,
          sales: [...current.sales, { 
            date: sale.date, 
            quantity: sale.quantity, 
            price: historicalPrice 
          }]
        });
      }
    });

    return Array.from(productSales.entries())
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        return {
          name: product?.name || 'Producto eliminado',
          ...stats
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedPeriod('daily')}
          className={`px-4 py-2 rounded ${
            selectedPeriod === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Ventas Diarias
        </button>
        <button
          onClick={() => setSelectedPeriod('weekly')}
          className={`px-4 py-2 rounded ${
            selectedPeriod === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Ventas Semanales
        </button>
        <button
          onClick={() => setSelectedPeriod('general')}
          className={`px-4 py-2 rounded ${
            selectedPeriod === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Ventas Generales
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Ventas</h3>
          <div className="space-y-2">
            <p className="text-gray-600">
              Total de Ventas: ${calculateTotalSales().toFixed(2)}
            </p>
            <p className="text-gray-600">
              Cantidad de Transacciones: {getFilteredSales().length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Histórico</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getTopProducts().map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(product.lastSaleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.sales[product.sales.length - 1].price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 