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

interface EditingProduct extends Omit<Product, 'price'> {
  price: number | string;
}

interface ProductManagementProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export default function ProductManagement({ products, setProducts }: ProductManagementProps) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: ''
  });
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price.replace(',', '.')),
      stock: parseInt(newProduct.stock),
      priceHistory: []
    };
    
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    await dataService.saveProducts(updatedProducts);
    setNewProduct({ name: '', price: '', stock: '' });
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString() // Convertir a string para edición
    });
  };

  const handleSaveEdit = async () => {
    if (editingProduct) {
      const originalProduct = products.find(p => p.id === editingProduct.id);
      if (!originalProduct) return;

      try {
        // Crear el producto actualizado con tipos correctos
        const updatedProduct = {
          ...editingProduct,
          name: editingProduct.name.trim(),
          price: typeof editingProduct.price === 'string' 
            ? parseFloat(editingProduct.price.replace(',', '.'))
            : editingProduct.price,
          stock: typeof editingProduct.stock === 'string'
            ? parseInt(editingProduct.stock)
            : editingProduct.stock
        };

        // Si el precio cambió, primero actualizar el historial de precios
        if (originalProduct.price !== updatedProduct.price) {
          await dataService.updateProductPrice(updatedProduct.id, updatedProduct.price);
        }

        // Luego actualizar todos los campos del producto
        const updatedProducts = products.map(p => 
          p.id === updatedProduct.id 
            ? {
                ...updatedProduct,
                price: updatedProduct.price,
                priceHistory: p.priceHistory // Mantener el historial de precios actualizado
              }
            : p
        );

        // Guardar todos los cambios
        await dataService.saveProducts(updatedProducts);
        setProducts(updatedProducts);
        setEditingProduct(null);

      } catch (error) {
        console.error('Error al guardar los cambios:', error);
        alert('Hubo un error al guardar los cambios');
      }
    }
  };

  const handlePriceChange = (value: string) => {
    if (editingProduct) {
      // Permitir solo números, punto y coma
      const sanitizedValue = value.replace(/[^\d.,]/g, '');
      // Reemplazar coma por punto si existe
      const normalizedValue = sanitizedValue.replace(',', '.');
      // Validar que sea un número válido
      if (!isNaN(parseFloat(normalizedValue)) || sanitizedValue === '' || sanitizedValue === '.') {
        setEditingProduct({ 
          ...editingProduct, 
          price: sanitizedValue
        });
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.price.toString().includes(searchTerm) ||
    product.stock.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddProduct} className="space-y-4">
        <div>
          <label className="form-label">Nombre del Producto</label>
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="form-label">Precio</label>
          <input
            type="text"
            value={newProduct.price}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d.,]/g, '');
              if (!isNaN(parseFloat(value.replace(',', '.'))) || value === '' || value === '.') {
                setNewProduct({ ...newProduct, price: value });
              }
            }}
            className="input-field"
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="form-label">Stock</label>
          <input
            type="number"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            className="input-field"
            required
            min="0"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Agregar Producto
        </button>
      </form>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Lista de Productos</h3>
          <div className="w-72">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="table-container overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="table-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="table-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="table-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="table-cell px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="input-field w-full"
                      />
                    ) : (
                      <span className="text-gray-900">{product.name}</span>
                    )}
                  </td>
                  <td className="table-cell px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="input-field w-full"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900">${product.price.toFixed(2)}</span>
                        <button
                          onClick={() => setShowHistory(product.id)}
                          className="text-sm text-[var(--primary-green)] hover:text-[var(--primary-dark)]"
                        >
                          Ver Historial
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="table-cell px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                        className="input-field w-full"
                        min="0"
                      />
                    ) : (
                      <span className="text-gray-900">{product.stock}</span>
                    )}
                  </td>
                  <td className="table-cell px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <button
                        onClick={handleSaveEdit}
                        className="btn-primary"
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="btn-secondary"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Price History Modal */}
      {showHistory !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full overflow-y-auto !m-0">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Historial de Precios</h3>
              <button
                onClick={() => setShowHistory(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {products.find(p => p.id === showHistory)?.priceHistory?.map((history, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium">${history.price.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(history.date).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 