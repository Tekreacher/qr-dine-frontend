import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import api from '../../api/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/menu/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      await api.post('/menu/categories', { name: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId) => {
    if (!editName.trim()) return;

    try {
      await api.put(`/menu/categories/${categoryId}`, { name: editName });
      setEditingId(null);
      setEditName('');
      fetchCategories();
    } catch (error) {
      alert('Error updating category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Delete this category and all its items?')) return;

    try {
      await api.delete(`/menu/categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Categories</h2>
      </div>

      {/* Add New Category */}
      <form onSubmit={handleAddCategory} className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add New Category
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Starters, Main Course, Desserts"
            className="input-field flex-1"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </form>

      {/* Categories List */}
      <div className="card">
        <h3 className="font-medium mb-4">Your Categories</h3>
        
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No categories yet. Add your first category above!
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                
                {editingId === category._id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field flex-1"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 font-medium">{category.name}</span>
                )}

                <div className="flex gap-2">
                  {editingId === category._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateCategory(category._id)}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                        }}
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(category._id);
                          setEditName(category.name);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>💡 Tip:</strong> Categories will appear as horizontal tabs on the customer menu. 
          Add all your categories first, then add items to each category.
        </p>
      </div>
    </div>
  );
}