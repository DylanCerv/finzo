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

interface PendingSale {
  id: string;
  title: string;
  items: SaleItem[];
  total: number;
  createdAt: string;
  lastUpdated: string;
}

interface SalesManagementProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
}

// Función auxiliar para cargar pendientes del localStorage
const loadPendingSalesFromStorage = (): PendingSale[] => {
  try {
    const savedPendingSales = localStorage.getItem('pendingSales');
    if (savedPendingSales) {
      return JSON.parse(savedPendingSales);
    }
  } catch (error) {
    console.error('Error al cargar ventas pendientes:', error);
  }
  return [];
};

export default function SalesManagement({ products, setProducts, sales, setSales }: SalesManagementProps) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saleTitle, setSaleTitle] = useState('');
  // Inicializar pendingSales con los datos del localStorage
  const [pendingSales, setPendingSales] = useState<PendingSale[]>(loadPendingSalesFromStorage());
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'pending'>('new');

  // Save pending sales to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingSales', JSON.stringify(pendingSales));
  }, [pendingSales]);

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

  // Agrupar ventas por hora
  const salesByHour = todaySales.reduce((acc, sale) => {
    const saleDate = new Date(sale.date);
    const hourKey = `${saleDate.getHours().toString().padStart(2, '0')}:${saleDate.getMinutes().toString().padStart(2, '0')}`;
    
    if (!acc[hourKey]) {
      acc[hourKey] = [];
    }
    
    // Verificar si el producto ya está en esta hora
    const existingProductIndex = acc[hourKey].findIndex(item => item.productId === sale.productId);
    
    if (existingProductIndex >= 0) {
      // Actualizar producto existente
      acc[hourKey][existingProductIndex].quantity += sale.quantity;
      acc[hourKey][existingProductIndex].total += sale.total;
    } else {
      // Agregar nuevo producto
      acc[hourKey].push({...sale});
    }
    
    return acc;
  }, {} as Record<string, Sale[]>);

  // Ordenar las horas de forma descendente (más recientes primero)
  const sortedHours = Object.keys(salesByHour).sort((a, b) => b.localeCompare(a));

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

  const handleSaveAsPending = () => {
    if (currentSaleItems.length === 0) return;

    const now = new Date().toISOString();
    
    if (editingSaleId) {
      // Update existing pending sale
      const updatedPendingSales = pendingSales.map(sale => 
        sale.id === editingSaleId 
          ? {
              ...sale,
              title: saleTitle,
              items: [...currentSaleItems],
              total: totalAmount,
              lastUpdated: now
            }
          : sale
      );
      
      setPendingSales(updatedPendingSales);
      setEditingSaleId(null);
    } else {
      // Create new pending sale
      const newPendingSale: PendingSale = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: saleTitle,
        items: [...currentSaleItems],
        total: totalAmount,
        createdAt: now,
        lastUpdated: now
      };
      
      setPendingSales([...pendingSales, newPendingSale]);
    }
    
    // Reset form
    setCurrentSaleItems([]);
    setTotalAmount(0);
    setSelectedProduct('');
    setQuantity('');
    setSaleTitle('');
    setPaymentAmount('');
    setActiveTab('pending');
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

      // Si estamos editando una venta pendiente, eliminarla de pendingSales
      if (editingSaleId) {
        setPendingSales(pendingSales.filter(sale => sale.id !== editingSaleId));
      }

      // Reset form
      setCurrentSaleItems([]);
      setTotalAmount(0);
      setSelectedProduct('');
      setQuantity('');
      setPaymentAmount('');
      setSaleTitle('');
      setEditingSaleId(null);
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      alert('Error al guardar la venta');
    }
  };
  
  const handleEditPendingSale = (saleId: string) => {
    const saleToEdit = pendingSales.find(sale => sale.id === saleId);
    if (!saleToEdit) return;
    
    setCurrentSaleItems(saleToEdit.items);
    setTotalAmount(saleToEdit.total);
    setSaleTitle(saleToEdit.title);
    setEditingSaleId(saleId);
    setActiveTab('new');
  };
  
  const handleDeletePendingSale = (saleId: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este registro pendiente?')) {
      setPendingSales(pendingSales.filter(sale => sale.id !== saleId));
    }
  };
  
  const handleCompletePendingSale = async (saleId: string) => {
    const saleToComplete = pendingSales.find(sale => sale.id === saleId);
    if (!saleToComplete) return;
    
    try {
      // Create new sales records from pending sale
      const newSales = saleToComplete.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          id: Date.now() + Math.random(), // Ensure unique ID
          productId: item.productId,
          productName: product?.name || 'Producto eliminado',
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.total,
          date: new Date().toISOString()
        };
      });

      // Update product stock
      const updatedProducts = products.map(product => {
        const saleItems = saleToComplete.items.filter(item => item.productId === product.id);
        if (saleItems.length > 0) {
          const totalQuantity = saleItems.reduce((sum, item) => sum + item.quantity, 0);
          return {
            ...product,
            stock: product.stock - totalQuantity
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
      
      // Remove the completed pending sale
      setPendingSales(pendingSales.filter(sale => sale.id !== saleId));
    } catch (error) {
      console.error('Error al completar la venta pendiente:', error);
      alert('Error al completar la venta pendiente');
    }
  };

  const handleCompleteAllPendingSales = async () => {
    if (pendingSales.length === 0) return;
    
    if (window.confirm('¿Está seguro que desea completar todas las ventas pendientes?')) {
      try {
        let allNewSales: any[] = [];
        let productQuantities: Record<number, number> = {};
        
        // Collect all items from pending sales
        pendingSales.forEach(pendingSale => {
          pendingSale.items.forEach(item => {
            // Add to new sales
            const product = products.find(p => p.id === item.productId);
            allNewSales.push({
              id: Date.now() + Math.random(), // Ensure unique ID
              productId: item.productId,
              productName: product?.name || 'Producto eliminado',
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.total,
              date: new Date().toISOString()
            });
            
            // Track quantities for stock update
            if (productQuantities[item.productId]) {
              productQuantities[item.productId] += item.quantity;
            } else {
              productQuantities[item.productId] = item.quantity;
            }
          });
        });
        
        // Update product stock
        const updatedProducts = products.map(product => {
          const quantity = productQuantities[product.id] || 0;
          if (quantity > 0) {
            return {
              ...product,
              stock: product.stock - quantity
            };
          }
          return product;
        });
        
        // Save everything
        await dataService.saveProducts(updatedProducts);
        await dataService.saveSales([...sales, ...allNewSales]);
        
        // Update state
        setProducts(updatedProducts);
        setSales([...sales, ...allNewSales]);
        
        // Clear all pending sales
        setPendingSales([]);
      } catch (error) {
        console.error('Error al completar todas las ventas pendientes:', error);
        alert('Error al completar todas las ventas pendientes');
      }
    }
  };

  const formatTimeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hace 1 día';
    return `Hace ${diffDays} días`;
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          className={`py-3 px-6 font-medium ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('new')}
        >
          {editingSaleId ? 'Editar Venta' : 'Nueva Venta'}
        </button>
        <button
          className={`py-3 px-6 font-medium ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('pending')}
        >
          Ventas Pendientes ({pendingSales.length})
        </button>
      </div>

      {activeTab === 'new' && (
        <>
          <div className="flex items-center mb-4">
            <label className="form-label mr-4">Título del Registro:</label>
            <input
              type="text"
              placeholder="Ej: Mesa 1, Cliente Juan, etc."
              value={saleTitle}
              onChange={(e) => setSaleTitle(e.target.value)}
              className="input-field w-64"
              required
            />
            {editingSaleId && (
              <button
                onClick={() => {
                  setEditingSaleId(null);
                  setCurrentSaleItems([]);
                  setTotalAmount(0);
                  setSaleTitle('');
                  setPaymentAmount('');
                }}
                className="ml-4 btn-secondary"
              >
                Cancelar Edición
              </button>
            )}
          </div>

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

              {!saleTitle &&
                <p className="text-red-400 ml-auto text-sm w-fit">Es necesario escribir un título para guardar la venta como pendiente</p>                
              }
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleSaveAsPending}
                  className="btn-secondary"
                  disabled={!saleTitle.trim()}
                >
                  {editingSaleId ? 'Actualizar Pendiente' : 'Guardar como Pendiente'}
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className="btn-primary"
                  disabled={!saleTitle.trim()}
                >
                  Completar Venta
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'pending' && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Ventas Pendientes</h3>
            {pendingSales.length > 0 && (
              <button
                onClick={handleCompleteAllPendingSales}
                className="btn-primary"
              >
                Completar Todas las Ventas
              </button>
            )}
          </div>

          {pendingSales.length > 0 ? (
            <div className="space-y-6">
              {pendingSales.map(pendingSale => (
                <div key={pendingSale.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">{pendingSale.title}</h4>
                      <p className="text-sm text-gray-500">
                        Creado: {formatTimeSince(pendingSale.createdAt)}
                        {pendingSale.createdAt !== pendingSale.lastUpdated && 
                          ` • Actualizado: ${formatTimeSince(pendingSale.lastUpdated)}`
                        }
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEditPendingSale(pendingSale.id)}
                        className="btn-secondary text-sm py-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCompletePendingSale(pendingSale.id)}
                        className="btn-primary text-sm py-1"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => handleDeletePendingSale(pendingSale.id)}
                        className="btn-danger text-sm py-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  
                  <div className="table-container">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="table-header">Producto</th>
                          <th className="table-header">Cantidad</th>
                          <th className="table-header">Precio Unit.</th>
                          <th className="table-header">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingSale.items.map((item, index) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={index}>
                              <td className="table-cell">
                                {product?.name || 'Producto eliminado'}
                              </td>
                              <td className="table-cell">{item.quantity}</td>
                              <td className="table-cell">${item.price.toFixed(2)}</td>
                              <td className="table-cell">${item.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-6 py-3 text-right font-medium">Total:</td>
                          <td className="table-cell font-bold">
                            ${pendingSale.total.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white shadow rounded-lg">
              <p className="text-gray-500">No hay ventas pendientes</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ventas del Día</h3>
          <span className="text-lg font-bold text-gray-900">
            Total del día: ${todayTotal.toFixed(2)}
          </span>
        </div>
        
        {sortedHours.length > 0 ? (
          <div className="space-y-6">
            {sortedHours.map(hour => (
              <div key={hour} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-700">Hora: {hour}</h4>
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
                      {salesByHour[hour].map((sale) => {
                        const product = products.find(p => p.id === sale.productId);
                        return (
                          <tr key={`${hour}-${sale.productId}`}>
                            <td className="table-cell">
                              {product?.name || 'Producto eliminado'}
                            </td>
                            <td className="table-cell">{sale.quantity}</td>
                            <td className="table-cell">${sale.total?.toFixed(2) || '0.00'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-6 py-2 text-right font-medium">Total:</td>
                        <td className="table-cell font-bold">
                          ${salesByHour[hour].reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white shadow rounded-lg">
            <p className="text-gray-500">No hay ventas registradas hoy</p>
          </div>
        )}
      </div>
    </div>
  );
} 