const API_URL = '/api';

// Load all products
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Failed to load products');
  }
}

// Display products in the UI
function displayProducts(products) {
  const container = document.getElementById('products-list');
  
  if (products.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1;">No products found</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card">
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
      <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
      <p><strong>Quantity:</strong> ${product.quantity}</p>
      <p><strong>Reorder Level:</strong> ${product.reorder_level}</p>
      <p><strong>Price:</strong> $${product.price?.toFixed(2) || '0.00'}</p>
      <p><strong>Supplier:</strong> ${product.supplier || 'N/A'}</p>
      <div class="actions">
        <button style="flex: 1;" onclick="openEditModal(${product.id})">✏️ Edit</button>
        <button class="delete" style="flex: 1;" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

// Modal Functions - Add Product
function openAddModal() {
  document.getElementById('addModal').classList.add('active');
  document.getElementById('addProductForm').reset();
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
  
  if (event.target == addModal) {
    closeAddModal();
  }
  if (event.target == editModal) {
    closeEditModal();
  }
}

// Load products on page load
document.addEventListener('DOMContentLoaded', loadProducts);


