import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X } from 'lucide-react';
import api from '../../api/api';

export default function MenuEditor() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    veg: true,
    image: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/menu');
      setCategories(response.data.categories || []);
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setFormData({ ...formData, image: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('veg', formData.veg);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (editingItem) {
        await api.put(`/menu/item/${editingItem._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/menu/item', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      veg: item.veg,
      image: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    
    try {
      await api.delete(`/menu/item/${itemId}`);
      fetchData();
    } catch (error) {
      alert('Error deleting item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const data = new FormData();
      data.append('available', !item.available);
      await api.put(`/menu/item/${item._id}`, data);
      fetchData();
    } catch (error) {
      alert('Error updating availability');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      veg: true,
      image: null
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Items</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter(item => item.category === cat.name).length;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="card">
          <h3 className="font-semibold mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Please create categories first in the Categories tab
                </p>
              )}
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Paneer Tikka"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="2"
                placeholder="Brief description of the dish"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="299"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Veg/Non-veg */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.veg === true}
                    onChange={() => setFormData({ ...formData, veg: true })}
                    className="w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Vegetarian
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.veg === false}
                    onChange={() => setFormData({ ...formData, veg: false })}
                    className="w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Non-Vegetarian
                  </span>
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Image
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <ImageIcon className="h-5 w-5" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {formData.image && (
                  <span className="text-sm text-green-600">
                    ✓ {formData.image.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Square image, max 5MB
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Menu Items List */}
      <div className="card">
        <h3 className="font-semibold mb-4">
          {selectedCategory === 'all' ? 'All Items' : `${selectedCategory} Items`}
        </h3>

        {filteredItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {categories.length === 0 
              ? 'Please create categories first, then add items.'
              : 'No items in this category yet. Add your first item!'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`flex gap-4 p-4 rounded-lg border-2 transition-all ${
                  item.available
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-300 bg-gray-50 opacity-60'
                }`}
              >
                {/* Item Image */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Item Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full ${
                            item.veg ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Category: <span className="font-medium">{item.category}</span>
                      </p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{item.price}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        item.available
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {item.available ? (
                        <><Check className="inline h-4 w-4 mr-1" />Available</>
                      ) : (
                        <><X className="inline h-4 w-4 mr-1" />Unavailable</>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      <Edit2 className="inline h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      <Trash2 className="inline h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}