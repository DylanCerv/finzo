import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Sale } from '../types/Sale';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface SalesReportProps {
  products: Product[];
  sales: Sale[];
  onClose: () => void;
}

const SalesReport: React.FC<SalesReportProps> = ({ products, sales, onClose }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getFilteredSales = () => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      
      if (reportType === 'daily' && selectedDate) {
        return (
          saleDate.getFullYear() === selectedDate.getFullYear() &&
          saleDate.getMonth() === selectedDate.getMonth() &&
          saleDate.getDate() === selectedDate.getDate()
        );
      } else if (reportType === 'weekly' && startDate && endDate) {
        return saleDate >= startDate && saleDate <= endDate;
      }
      return false;
    });
  };

  const calculateTotal = (sales: Sale[]) => {
    return sales.reduce((total, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return total + (product ? product.price * sale.quantity : 0);
    }, 0);
  };

  const filteredSales = getFilteredSales();
  const totalAmount = calculateTotal(filteredSales);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold gradient-text">Reporte de Ventas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  reportType === 'daily' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Reporte Diario
              </button>
              <button
                onClick={() => setReportType('weekly')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  reportType === 'weekly' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Reporte Semanal
              </button>
            </div>

            <div className="mb-6">
              {reportType === 'daily' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Fecha
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date || undefined)}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              ) : (
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicial
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date || undefined)}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Final
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date || undefined)}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm"
                      dateFormat="dd/MM/yyyy"
                      minDate={startDate}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map(sale => {
                    const product = products.find(p => p.id === sale.productId);
                    return (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product?.name || 'Producto no encontrado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(product ? product.price * sale.quantity : 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport; 