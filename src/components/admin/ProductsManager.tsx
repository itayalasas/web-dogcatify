import React, { useState, useEffect } from 'react';
import { productsService, PartnerProduct } from '../../services/admin.service';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Save, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProductsManager = () => {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PartnerProduct | null>(null);

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

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await productsService.toggleActive(id, !isActive);
      loadProducts();
    } catch (error) {
      console.error('Error toggling product:', error);
      alert('Error al cambiar el estado del producto');
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
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando productos...</div>;
  }

  return (
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
                  onClick={() => handleToggleActive(product.id, product.is_active || false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  {product.is_active ? <ToggleRight className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                  {product.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-100 transition-colors"
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
    </div>
  );
};

export default ProductsManager;
