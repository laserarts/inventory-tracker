// Use relative URLs so it works on both localhost and Vercel
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? '/api' 
  : '/api';

let allProducts = [];
let categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden'];

// Load all products
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    allProducts = await response.json();
    loadCategories();
    filterProducts();
    updateStats();
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Failed to load products');
  }
}

// Filter and display products
function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const sortBy = document.getElementById('sortBy').value;
  const showLowStockOnly = document.getElementById('showLowStock').checked;

  let filtered = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                         (product.description || '').toLowerCase().includes(searchTerm) ||
                         (product.supplier || '').toLowerCase().includes(searchTerm);
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const isLowStock = product.quantity < product.reorder_level;
    const matchesLowStock = !showLowStockOnly || isLowStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Sort products
  switch(sortBy) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'price':
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'quantity':
      filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
      break;
    case 'lowstock':
      filtered.sort((a, b) => (a.quantity - a.reorder_level) - (b.quantity - b.reorder_level));
      break;
    case 'newest':
    default:
      filtered.sort((a, b) => b.id - a.id);
  }

  displayProducts(filtered);
}

// Display products in the UI
function displayProducts(products) {
  const container = document.getElementById('products-list');
  
  if (products.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No products found</p>';
    return;
  }

  container.innerHTML = products.map(product => {
    const isLowStock = product.quantity < product.reorder_level;
    return `
      <div class="product-card ${isLowStock ? 'low-stock' : ''}">
        <h3>${product.name}</h3>
        <span class="category-badge">${product.category || 'Uncategorized'}</span>
        <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
        <p><strong>Quantity:</strong> <span style="color: ${isLowStock ? '#e74c3c' : '#333'}">${product.quantity}</span> (Reorder: ${product.reorder_level})</p>
        <p><strong>Price:</strong> $${product.price?.toFixed(2) || '0.00'}</p>
        <p><strong>Supplier:</strong> ${product.supplier || 'N/A'}</p>
        <div class="actions">
          <button style="flex: 1;" onclick="openEditModal(${product.id})">✏️ Edit</button>
          <button class="delete" style="flex: 1;" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Update statistics
function updateStats() {
  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter(p => p.quantity < p.reorder_level).length;
  const totalValue = allProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);

  document.getElementById('totalProducts').textContent = totalProducts;
  document.getElementById('lowStockCount').textContent = lowStockCount;
  document.getElementById('totalValue').textContent = totalValue.toFixed(2);
}

// Load categories and populate dropdowns
function loadCategories() {
  const addCategorySelect = document.getElementById('productCategory');
  const editCategorySelect = document.getElementById('editProductCategory');
  const categoryFilter = document.getElementById('categoryFilter');

  // Get unique categories from products
  const productCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const allCategories = [...new Set([...categories, ...productCategories])];

  [addCategorySelect, editCategorySelect].forEach(select => {
    select.innerHTML = '<option value="">Select a category</option>';
    allCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  });
}

// Category Modal Functions
function openCategoryModal() {
  displayCategories();
  document.getElementById('categoryModal').classList.add('active');
  document.getElementById('newCategoryInput').value = '';
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.remove('active');
}

function displayCategories() {
  const allCategories = [...new Set([...categories, ...allProducts.map(p => p.category).filter(Boolean)])];
  const container = document.getElementById('categoriesList');

  container.innerHTML = '<div class="categories-list">' + allCategories.map(cat => `
    <div class="category-item">
      <span>${cat}</span>
      <button onclick="deleteCategory('${cat}')">❌</button>
    </div>
  `).join('') + '</div>';
}

function addCategory() {
  const input = document.getElementById('newCategoryInput').value.trim();
  if (!input) {
    alert('Please enter a category name');
    return;
  }

  if (categories.includes(input)) {
    alert('Category already exists');
    return;
  }

  categories.push(input);
  displayCategories();
  loadCategories();
  document.getElementById('newCategoryInput').value = '';
}

function deleteCategory(category) {
  const productsInCategory = allProducts.filter(p => p.category === category).length;
  
  if (productsInCategory > 0) {
    alert(`Cannot delete category with ${productsInCategory} product(s). Please reassign them first.`);
    return;
  }

  categories = categories.filter(c => c !== category);
  displayCategories();
  loadCategories();
}

// Modal Functions - Add Product
function openAddModal() {
  document.getElementById('addModal').classList.add('active');
  document.getElementById('addProductForm').reset();
  loadCategories();
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('active');
  document.getElementById('addProductForm').reset();
}

function submitAddProduct(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('addProductForm'));
  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    quantity: parseInt(formData.get('quantity')) || 0,
    reorder_level: parseInt(formData.get('reorder_level')) || 0,
    price: parseFloat(formData.get('price')) || 0,
    supplier: formData.get('supplier')
  };

  addProduct(data);
}

async function addProduct(data) {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('✅ Product added successfully');
      closeAddModal();
      loadProducts();
    } else {
      const error = await response.json();
      alert('❌ Failed to add product: ' + error.error);
    }
  } catch (error) {
    console.error('Error adding product:', error);
    alert('❌ Error adding product');
  }
}

// Modal Functions - Edit Product
async function openEditModal(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const product = await response.json();

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';
    document.getElementById('editProductQuantity').value = product.quantity || 0;
    document.getElementById('editProductReorder').value = product.reorder_level || 0;
    document.getElementById('editProductPrice').value = product.price || 0;
    document.getElementById('editProductSupplier').value = product.supplier || '';

    loadCategories();
    document.getElementById('editModal').classList.add('active');
  } catch (error) {
    console.error('Error loading product:', error);
    alert('Failed to load product');
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  document.getElementById('editProductForm').reset();
}

function submitEditProduct(event) {
  event.preventDefault();
  const id = document.getElementById('editProductId').value;
  const formData = new FormData(document.getElementById('editProductForm'));
  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    quantity: parseInt(formData.get('quantity')) || 0,
    reorder_level: parseInt(formData.get('reorder_level')) || 0,
    price: parseFloat(formData.get('price')) || 0,
    supplier: formData.get('supplier')
  };

  updateProduct(id, data);
}

async function updateProduct(id, data) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('✅ Product updated successfully');
      closeEditModal();
      loadProducts();
    } else {
      const error = await response.json();
      alert('❌ Failed to update product: ' + error.error);
    }
  } catch (error) {
    console.error('Error updating product:', error);
    alert('❌ Error updating product');
  }
}

// Delete product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('✅ Product deleted successfully');
      loadProducts();
    } else {
      const error = await response.json();
      alert('❌ Failed to delete product: ' + error.error);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('❌ Error deleting product');
  }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const addModal = document.getElementById('addModal');
  const editModal = document.getElementById('editModal');
  const categoryModal = document.getElementById('categoryModal');
  
  if (event.target == addModal) {
    closeAddModal();
  }
  if (event.target == editModal) {
    closeEditModal();
  }
  if (event.target == categoryModal) {
    closeCategoryModal();
  }
}

// Load products on page load
document.addEventListener('DOMContentLoaded', loadProducts);



