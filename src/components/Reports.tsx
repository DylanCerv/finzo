import { useState } from 'react';
import { Sale } from '../types/Sale';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
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

  const formatDate = (dateStr: string) => {
    const saleDate = new Date(dateStr);
    
    if (selectedPeriod === 'daily') {
      // Para ventas diarias, mostrar solo la hora
      return saleDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Para ventas semanales y generales, mostrar solo la fecha
      return saleDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getGroupedProducts = () => {
    const filteredSales = getFilteredSales();
    const groupedSales = new Map<string, Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      date: string;
    }>>();

    // Agrupar ventas por fecha
    filteredSales.forEach(sale => {
      if (!sale) return; // Skip if sale is undefined
      
      const dateKey = formatDate(sale.date);
      if (!dateKey) return; // Skip if date is invalid

      const saleItem = {
        name: sale.productName || 'Unknown Product',
        quantity: sale.quantity || 0,
        unitPrice: sale.unitPrice || 0,
        total: sale.total || 0,
        date: sale.date
      };

      if (!groupedSales.has(dateKey)) {
        groupedSales.set(dateKey, []);
      }
      groupedSales.get(dateKey)?.push(saleItem);
    });

    // Ordenar cada grupo alfabéticamente
    groupedSales.forEach((sales, date) => {
      if (!sales) return; // Skip if sales array is undefined
      
      sales.sort((a, b) => {
        // Primero ordenar por nombre
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        // Si los nombres son iguales, ordenar por precio
        return b.unitPrice - a.unitPrice;
      });
    });

    // Convertir el Map a un array ordenado por fecha y asegurar que no haya valores undefined
    return Array.from(groupedSales.entries())
      .filter(([_, sales]) => sales && sales.length > 0 && sales[0]?.date) // Ensure we have valid sales data
      .sort((a, b) => {
        const dateA = new Date(a[1][0].date);
        const dateB = new Date(b[1][0].date);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const calculateTotalSales = () => {
    const filteredSales = getFilteredSales();
    return filteredSales.reduce((total, sale) => {
      if (!sale || typeof sale.total !== 'number') return total;
      return total + sale.total;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedPeriod('daily')}
          className={selectedPeriod === 'daily' ? 'btn-primary' : 'btn-secondary'}
        >
          Ventas Diarias
        </button>
        <button
          onClick={() => setSelectedPeriod('weekly')}
          className={selectedPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}
        >
          Ventas Semanales
        </button>
        <button
          onClick={() => setSelectedPeriod('general')}
          className={selectedPeriod === 'general' ? 'btn-primary' : 'btn-secondary'}
        >
          Ventas Generales
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
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

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Vendidos</h3>
          <div className="table-container">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedPeriod !== 'daily' && (
                    <th className="table-header">Fecha</th>
                  )}
                  {selectedPeriod === 'daily' && (
                    <th className="table-header">Hora</th>
                  )}
                  <th className="table-header">Producto</th>
                  <th className="table-header">Precio Unit.</th>
                  <th className="table-header">Cantidad</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getGroupedProducts().map(([date, sales]) => (
                  sales.map((sale, index) => (
                    <tr key={`${date}-${index}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <td rowSpan={sales.length} className="table-cell border-r font-medium">
                          {date}
                        </td>
                      )}
                      <td className="table-cell">{sale.name}</td>
                      <td className="table-cell">${(sale.unitPrice || 0).toFixed(2)}</td>
                      <td className="table-cell">{sale.quantity}</td>
                      <td className="table-cell">${(sale.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 