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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      priceHistory: []
    };
    
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    await dataService.saveProducts(updatedProducts);
    setNewProduct({ name: '', price: '', stock: '' });
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
  };

  const handleSaveEdit = async () => {
    if (editingProduct) {
      const originalProduct = products.find(p => p.id === editingProduct.id);
      if (originalProduct && originalProduct.price !== editingProduct.price) {
        // Si el precio cambió, actualizar el historial
        await dataService.updateProductPrice(editingProduct.id, editingProduct.price);
        const updatedProducts = await dataService.getProducts();
        setProducts(updatedProducts);
      } else {
        // Si solo cambió el nombre o stock
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id ? editingProduct : p
        );
        setProducts(updatedProducts);
        await dataService.saveProducts(updatedProducts);
      }
      setEditingProduct(null);
    }
  };

  const handleUpdatePrice = async (productId: number, newPrice: number) => {
    await dataService.updateProductPrice(productId, newPrice);
    const updatedProducts = await dataService.getProducts();
    setProducts(updatedProducts);
  };

  const handleUpdateStock = async (productId: number, newStock: number) => {
    await dataService.updateProductStock(productId, newStock);
    const updatedProducts = await dataService.getProducts();
    setProducts(updatedProducts);
  };

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
            type="number"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            className="input-field"
            required
            min="0"
            step="0.01"
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lista de Productos</h3>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Nombre</th>
                <th className="table-header">Precio</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="table-cell">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="input-field"
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td className="table-cell">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                        className="input-field"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        ${product.price.toFixed(2)}
                        <button
                          onClick={() => setShowHistory(product.id)}
                          className="text-sm text-[var(--primary-green)] hover:text-[var(--primary-dark)]"
                        >
                          Ver Historial
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                        className="input-field"
                        min="0"
                      />
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td className="table-cell">
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

        {/* Price History Modal */}
        {showHistory !== null && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-lg font-medium mb-4">Historial de Precios</h3>
              <div className="space-y-2">
                {products.find(p => p.id === showHistory)?.priceHistory?.map((history, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>${history.price.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm">
                      {new Date(history.date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowHistory(null)}
                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 