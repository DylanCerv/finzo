import { useState, useEffect } from 'react'
import './index.css'
import ProductManagement from './components/ProductManagement'
import SalesManagement from './components/SalesManagement'
import Reports from './components/Reports'
import { dataService } from './services/dataService'

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

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'sales' | 'reports'>('products');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedProducts, loadedSales] = await Promise.all([
          dataService.getProducts(),
          dataService.getSales()
        ]);
        setProducts(loadedProducts);
        setSales(loadedSales);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExportData = async () => {
    try {
      await dataService.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImportData = async () => {
    try {
      await dataService.importData();
      const [loadedProducts, loadedSales] = await Promise.all([
        dataService.getProducts(),
        dataService.getSales()
      ]);
      setProducts(loadedProducts);
      setSales(loadedSales);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold gradient-text">Finzo</h1>
              <div className="hidden md:flex space-x-4">
                <button 
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'products' 
                      ? 'btn-primary' 
                      : 'text-gray-600 hover:text-[var(--primary-green)]'
                  }`}
                >
                  Productos
                </button>
                <button 
                  onClick={() => setActiveTab('sales')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'sales' 
                      ? 'btn-primary' 
                      : 'text-gray-600 hover:text-[var(--primary-green)]'
                  }`}
                >
                  Ventas
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'reports' 
                      ? 'btn-primary' 
                      : 'text-gray-600 hover:text-[var(--primary-green)]'
                  }`}
                >
                  Reportes
                </button>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleImportData}
                className="btn-secondary"
              >
                Importar
              </button>
              <button
                onClick={handleExportData}
                className="btn-primary"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'products' && (
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-semibold mb-6 gradient-text">Gestión de Productos</h2>
              <ProductManagement products={products} setProducts={setProducts} />
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-semibold mb-6 gradient-text">Registro de Ventas</h2>
              <SalesManagement 
                products={products} 
                setProducts={setProducts} 
                sales={sales} 
                setSales={setSales} 
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-semibold mb-6 gradient-text">Reportes y Estadísticas</h2>
              <Reports products={products} sales={sales} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
