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
  sales: Sale[] | any[];
}

// Tipo para datos agrupados por producto (vista diaria)
interface ProductGroupItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  titles: string[];
}

// Tipo para datos agrupados por fecha (vista semanal/general)
interface DateGroupItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
}

// Tipos para los resultados de la agrupación
type DailyGroupResult = {
  type: 'daily';
  data: ProductGroupItem[];
};

type DateGroupResult = {
  type: 'date';
  data: Array<[string, DateGroupItem[]]>;
};

type GroupResult = DailyGroupResult | DateGroupResult;

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

  const getGroupedProducts = (): GroupResult => {
    const filteredSales = getFilteredSales();
    
    // Si es vista diaria, agrupamos por producto
    if (selectedPeriod === 'daily') {
      // Objeto para agrupar productos
      const productGroups: Record<string, ProductGroupItem> = {};
      
      // Agrupar ventas por producto
      filteredSales.forEach(sale => {
        if (!sale) return;
        
        const productKey = sale.productName || 'Unknown Product';
        
        if (!productGroups[productKey]) {
          productGroups[productKey] = {
            name: productKey,
            quantity: 0,
            unitPrice: sale.unitPrice || 0,
            total: 0,
            titles: []
          };
        }
        
        // Acumular cantidades y totales
        productGroups[productKey].quantity += sale.quantity || 0;
        productGroups[productKey].total += sale.total || 0;
        
        // Agregar títulos únicos
        if (sale.title && !productGroups[productKey].titles.includes(sale.title)) {
          productGroups[productKey].titles.push(sale.title);
        }
      });
      
      // Convertir a array y ordenar por nombre
      const result = Object.values(productGroups).sort((a, b) => a.name.localeCompare(b.name));
      
      // Retornamos un objeto diferente para la vista diaria
      return { 
        type: 'daily',
        data: result
      };
    } else {
      // Para semanal y general mantenemos la agrupación por fecha
      const groupedSales = new Map<string, DateGroupItem[]>();

      // Agrupar ventas por fecha
      filteredSales.forEach(sale => {
        if (!sale) return; // Skip if sale is undefined
        
        const dateKey = formatDate(sale.date);
        if (!dateKey) return; // Skip if date is invalid

        const saleItem: DateGroupItem = {
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
      const dateGroups = Array.from(groupedSales.entries())
        .filter(([_, sales]) => sales && sales.length > 0 && sales[0]?.date) // Ensure we have valid sales data
        .sort((a, b) => {
          const dateA = new Date(a[1][0].date);
          const dateB = new Date(b[1][0].date);
          return dateB.getTime() - dateA.getTime();
        });
      
      return {
        type: 'date',
        data: dateGroups
      };
    }
  };

  const calculateTotalSales = () => {
    const filteredSales = getFilteredSales();
    return filteredSales.reduce((total, sale) => {
      if (!sale || typeof sale.total !== 'number') return total;
      return total + sale.total;
    }, 0);
  };

  const groupedData = getGroupedProducts();

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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedPeriod === 'daily' ? 'Productos Vendidos Hoy' : 'Productos Vendidos'}
          </h3>
          <div className="table-container">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedPeriod === 'daily' ? (
                    <>
                      <th className="table-header">Producto</th>
                      <th className="table-header">Títulos</th>
                      <th className="table-header">Precio Unit.</th>
                      <th className="table-header">Cantidad</th>
                      <th className="table-header">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="table-header">Fecha</th>
                      <th className="table-header">Producto</th>
                      <th className="table-header">Precio Unit.</th>
                      <th className="table-header">Cantidad</th>
                      <th className="table-header">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupedData.type === 'daily' && (
                  // Vista diaria: productos agrupados
                  groupedData.data.map((product, index) => (
                    <tr key={`product-${index}`} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{product.name}</td>
                      <td className="table-cell">{product.titles.join(', ') || 'Sin título'}</td>
                      <td className="table-cell">${(product.unitPrice || 0).toFixed(2)}</td>
                      <td className="table-cell">{product.quantity}</td>
                      <td className="table-cell">${(product.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
                {groupedData.type === 'date' && (
                  // Vista semanal/general: agrupados por fecha
                  groupedData.data.flatMap(([date, items], dateIndex) => (
                    items.map((item, itemIndex) => (
                      <tr key={`${date}-${itemIndex}`} className="hover:bg-gray-50">
                        {itemIndex === 0 && (
                          <td rowSpan={items.length} className="table-cell border-r font-medium">
                            {date}
                          </td>
                        )}
                        <td className="table-cell">{item.name}</td>
                        <td className="table-cell">${(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="table-cell">{item.quantity}</td>
                        <td className="table-cell">${(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 