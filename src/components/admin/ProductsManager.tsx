import React, { useState, useEffect } from 'react';
import { productsService, PartnerProduct } from '../../services/admin.service';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Save, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';

const ProductsManager = () => {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PartnerProduct | null>(null);
  const { showNotification, NotificationContainer } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    is_active: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: PartnerProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock?.toString() || '',
      category: product.category || '',
      is_active: product.is_active || true
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('partner_products')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: formData.stock ? parseInt(formData.stock) : null,
          category: formData.category || null,
          is_active: formData.is_active
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setShowModal(false);
      await loadProducts();
      showNotification('success', 'Producto actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating product:', error);
      showNotification('error', 'No se pudo actualizar el producto. Por favor, intente nuevamente.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await productsService.toggleActive(id, !isActive);
      await loadProducts();
      showNotification('success', `Producto ${!isActive ? 'activado' : 'desactivado'} correctamente`);
    } catch (error: any) {
      console.error('Error toggling product:', error);
      showNotification('error', 'No se pudo cambiar el estado del producto. Por favor, intente nuevamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadProducts();
      showNotification('success', 'Producto eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showNotification('error', 'No se pudo eliminar el producto. Por favor, intente nuevamente.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando productos...</div>;
  }

  return (
    <>
      <NotificationContainer />
      <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
                {product.is_active ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactivo</span>
                )}
              </div>
              {product.category && (
                <p className="text-xs text-gray-500 mb-2 capitalize">{product.category}</p>
              )}
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <div className="text-teal-600 font-bold">${product.price}</div>
                {product.stock !== null && (
                  <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-3">{product.partner_name}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-teal-50 text-teal-600 px-2 py-1 rounded text-xs hover:bg-teal-100 transition-colors"
                  title="Editar"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleToggleActive(product.id, product.is_active || false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  {product.is_active ? <ToggleRight className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                  {product.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-100 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay productos registrados
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Producto</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Producto activo</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ProductsManager;
