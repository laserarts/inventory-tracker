// Use relative URLs so it works on both localhost and Vercel
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? '/api' 
  : '/api';

let allProducts = [];
let categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden'];
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize dark mode on load and ensure products load before initializing views/charts
document.addEventListener('DOMContentLoaded', async function() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  }
  // Wait for products to load before switching views or initializing charts
  await loadProducts();
  // Set dashboard as default view after data is available
  switchView('dashboard');
  // Check for low stock and show notifications
  setTimeout(checkLowStockNotifications, 1000);
});
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    allProducts = await response.json();
    loadCategories();
    filterProducts();
    updateStats();
    populateAnalytics();
  } catch (error) {
    console.error('Error loading products:', error);
    showNotification('❌ Failed to load products', 'error');
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
      showNotification('✅ Product added successfully', 'success');
      closeAddModal();
      loadProducts();
    } else {
      const error = await response.json();
      showNotification(`❌ Failed to add product: ${error.error}`, 'error');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showNotification('❌ Error adding product', 'error');
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
      showNotification('✅ Product updated successfully', 'success');
      closeEditModal();
      loadProducts();
    } else {
      const error = await response.json();
      showNotification(`❌ Failed to update product: ${error.error}`, 'error');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showNotification('❌ Error updating product', 'error');
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
      showNotification('✅ Product deleted successfully', 'success');
      loadProducts();
    } else {
      const error = await response.json();
      showNotification(`❌ Failed to delete product: ${error.error}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    showNotification('❌ Error deleting product', 'error');
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

// Dark Mode Toggle
function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  
  if (darkMode) {
    document.body.classList.add('dark-mode');
    showNotification('🌙 Dark mode enabled', 'success');
  } else {
    document.body.classList.remove('dark-mode');
    showNotification('☀️ Light mode enabled', 'info');
  }
}

// Notification System
function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notificationContainer');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Check Low Stock and Show Notifications
function checkLowStockNotifications() {
  const lowStockItems = allProducts.filter(p => p.quantity < p.reorder_level);
  
  if (lowStockItems.length > 0) {
    const itemNames = lowStockItems.slice(0, 2).map(p => p.name).join(', ');
    const moreText = lowStockItems.length > 2 ? ` and ${lowStockItems.length - 2} more` : '';
    showNotification(`⚠️ Low stock alert: ${itemNames}${moreText}`, 'warning', 5000);
  }
}

// View Switching
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected view
  const viewId = viewName + 'View';
  const viewElement = document.getElementById(viewId);
  if (viewElement) {
    viewElement.classList.add('active');

    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.textContent.toLowerCase().includes(viewName)) {
        item.classList.add('active');
      }
    });

    // Load data based on view
    if (viewName === 'analytics') {
      populateAnalytics();
      initCharts();
    } else if (viewName === 'reports') {
      populateReports();
    } else if (viewName === 'dashboard') {
      initCharts();
    }
  }
}

// Initialize Charts
function initCharts() {
  // Only initialize if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    return;
  }

  // Destroy existing charts to allow recreation
  if (window.stockChartInstance) window.stockChartInstance.destroy();
  if (window.categoryChartInstance) window.categoryChartInstance.destroy();
  if (window.valueChartInstance) window.valueChartInstance.destroy();
  if (window.statusChartInstance) window.statusChartInstance.destroy();

  // Only render charts if we have data
  if (allProducts.length === 0) return;

  // Stock Distribution Chart
  const stockCtx = document.getElementById('stockChart');
  if (stockCtx) {
    const data = allProducts.slice(0, 8).map(p => ({ name: p.name.substring(0, 12), qty: p.quantity }));
    window.stockChartInstance = new Chart(stockCtx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Stock Quantity',
          data: data.map(d => d.qty),
          backgroundColor: '#667eea',
          borderColor: '#764ba2',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  // Category Chart
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx) {
    const categoryData = {};
    allProducts.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryData[cat] = (categoryData[cat] || 0) + 1;
    });

    window.categoryChartInstance = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: ['#667eea', '#764ba2', '#e74c3c', '#27ae60', '#f39c12']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Value by Category Chart
  const valueCtx = document.getElementById('valueChart');
  if (valueCtx) {
    const valueData = {};
    allProducts.forEach(p => {
      const cat = p.category || 'Uncategorized';
      valueData[cat] = (valueData[cat] || 0) + ((p.quantity || 0) * (p.price || 0));
    });

    window.valueChartInstance = new Chart(valueCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(valueData),
        datasets: [{
          data: Object.values(valueData),
          backgroundColor: ['#667eea', '#764ba2', '#e74c3c', '#27ae60', '#f39c12']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Stock Status Chart
  const statusCtx = document.getElementById('stockStatusChart');
  if (statusCtx) {
    const inStock = allProducts.filter(p => p.quantity >= p.reorder_level).length;
    const lowStock = allProducts.filter(p => p.quantity < p.reorder_level).length;

    window.statusChartInstance = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['In Stock', 'Low Stock'],
        datasets: [{
          data: [inStock, lowStock],
          backgroundColor: ['#27ae60', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }
}

// Populate Analytics Table
function populateAnalytics() {
  const tableBody = document.getElementById('analyticsTableBody');
  if (!tableBody) return;

  // Get filter values
  const searchTerm = (document.getElementById('analyticsSearchInput')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('analyticsCategoryFilter')?.value || '';
  const sortBy = document.getElementById('analyticsSortBy')?.value || 'name';

  // Filter products
  let filtered = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                         (product.description || '').toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort products
  switch(sortBy) {
    case 'value':
      filtered.sort((a, b) => 
        ((b.quantity || 0) * (b.price || 0)) - ((a.quantity || 0) * (a.price || 0))
      );
      break;
    case 'quantity':
      filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      break;
    case 'price':
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'name':
    default:
      filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows = filtered.map(product => {
    const totalValue = (product.quantity || 0) * (product.price || 0);
    const status = product.quantity < product.reorder_level ? '⚠️ Low' : '✅ Good';

    return `
      <tr>
        <td>${product.name}</td>
        <td>${product.category || 'Uncategorized'}</td>
        <td>${product.quantity}</td>
        <td>$${product.price?.toFixed(2) || '0.00'}</td>
        <td>$${totalValue.toFixed(2)}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = rows || '<tr><td colspan="6" style="text-align: center;">No products to display</td></tr>';

  // Update categoriesfilter dropdown if not already populated
  const categorySelect = document.getElementById('analyticsCategoryFilter');
  if (categorySelect && categorySelect.options.length === 1) {
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    uniqueCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }

  // Update stats
  const categoryCount = [...new Set(filtered.map(p => p.category))].length;
  if (document.getElementById('totalCategories')) {
    document.getElementById('totalCategories').textContent = categoryCount;
  }
}

// Filter analytics
function filterAnalytics() {
  populateAnalytics();
}

// Populate Reports
function populateReports() {
  // Get date filters
  const fromDate = document.getElementById('reportDateFrom')?.value || null;
  const toDate = document.getElementById('reportDateTo')?.value || null;

  // Filter products by date range (if created_at field exists)
  let filteredProducts = allProducts;
  
  if (fromDate || toDate) {
    filteredProducts = allProducts.filter(product => {
      if (!product.created_at) return true;
      const productDate = new Date(product.created_at);
      if (fromDate && productDate < new Date(fromDate)) return false;
      if (toDate && productDate > new Date(toDate)) return false;
      return true;
    });
  }

  // Inventory Summary
  const inventorySummary = document.getElementById('inventorySummary');
  if (inventorySummary) {
    const totalProducts = filteredProducts.length;
    const totalValue = filteredProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);

    inventorySummary.innerHTML = `
      <strong>Total Products:</strong> ${totalProducts}<br>
      <strong>Total Inventory Value:</strong> $${totalValue.toFixed(2)}<br>
      <strong>Average Product Value:</strong> $${(totalValue / totalProducts || 0).toFixed(2)}
    `;
  }

  // Stock Alerts
  const stockAlerts = document.getElementById('stockAlerts');
  if (stockAlerts) {
    const lowStockProducts = filteredProducts.filter(p => p.quantity < p.reorder_level);
    
    if (lowStockProducts.length === 0) {
      stockAlerts.innerHTML = '<p style="color: #27ae60;">✅ All products are well stocked</p>';
    } else {
      stockAlerts.innerHTML = `
        <p style="color: #e74c3c;">⚠️ ${lowStockProducts.length} products need restocking:</p>
        <ul style="margin: 10px 0 0 20px;">
          ${lowStockProducts.map(p => `<li>${p.name} (${p.quantity}/${p.reorder_level})</li>`).join('')}
        </ul>
      `;
    }
  }

  // Top Products
  const topProducts = document.getElementById('topProducts');
  if (topProducts) {
    const sorted = [...filteredProducts].sort((a, b) => 
      ((b.quantity || 0) * (b.price || 0)) - ((a.quantity || 0) * (a.price || 0))
    ).slice(0, 5);

    topProducts.innerHTML = `
      <ol>
        ${sorted.map(p => `
          <li>${p.name} - $${((p.quantity || 0) * (p.price || 0)).toFixed(2)}</li>
        `).join('')}
      </ol>
    `;
  }
}

// Reset report dates
function resetReportDates() {
  document.getElementById('reportDateFrom').value = '';
  document.getElementById('reportDateTo').value = '';
  populateReports();
  showNotification('📅 Date filters reset', 'info');
}

// Toggle View Mode
// Export CSV
function exportCSV() {
  if (allProducts.length === 0) {
    showNotification('⚠️ No products to export', 'warning');
    return;
  }

  const headers = ['Product', 'Category', 'Quantity', 'Reorder Level', 'Price', 'Total Value', 'Supplier', 'Description'];
  const rows = allProducts.map(p => [
    p.name,
    p.category || 'N/A',
    p.quantity,
    p.reorder_level,
    p.price?.toFixed(2) || '0',
    ((p.quantity || 0) * (p.price || 0)).toFixed(2),
    p.supplier || 'N/A',
    p.description || 'N/A'
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  showNotification('✅ CSV exported successfully', 'success');
}

// Download Report (Text)
function downloadReport() {
  const fromDate = document.getElementById('reportDateFrom')?.value || 'All dates';
  const toDate = document.getElementById('reportDateTo')?.value || 'All dates';
  const totalProducts = allProducts.length;
  const totalValue = allProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockProducts = allProducts.filter(p => p.quantity < p.reorder_level);

  let report = `INVENTORY REPORT\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Date Range: ${fromDate} to ${toDate}\n\n`;
  report += `SUMMARY\n`;
  report += `Total Products: ${totalProducts}\n`;
  report += `Total Value: $${totalValue.toFixed(2)}\n`;
  report += `Low Stock Items: ${lowStockProducts.length}\n\n`;
  report += `LOW STOCK ALERT\n`;
  report += lowStockProducts.map(p => `${p.name}: ${p.quantity}/${p.reorder_level}`).join('\n') || 'None\n';

  const blob = new Blob([report], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
  showNotification('✅ Text report downloaded', 'success');
}

// Download Report (PDF) - Using HTML2PDF or similar approach
function downloadReportPDF() {
  // Check if html2pdf library is available
  if (typeof html2pdf === 'undefined') {
    // Load html2pdf library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
    
    script.onload = generatePDF;
  } else {
    generatePDF();
  }
}

function generatePDF() {
  const fromDate = document.getElementById('reportDateFrom')?.value || 'All';
  const toDate = document.getElementById('reportDateTo')?.value || 'All';
  const totalValue = allProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const lowStockProducts = allProducts.filter(p => p.quantity < p.reorder_level);

  const element = document.createElement('div');
  element.innerHTML = `
    <h1>Inventory Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
    
    <h2>Summary</h2>
    <p>Total Products: ${allProducts.length}</p>
    <p>Total Inventory Value: $${totalValue.toFixed(2)}</p>
    <p>Low Stock Items: ${lowStockProducts.length}</p>
    
    <h2>Low Stock Alerts</h2>
    <ul>
      ${lowStockProducts.map(p => `<li>${p.name}: ${p.quantity}/${p.reorder_level}</li>`).join('')}
    </ul>
    
    <h2>All Products</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Category</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
        </tr>
      </thead>
      <tbody>
        ${allProducts.map(p => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.category || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${p.price?.toFixed(2) || '0'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${((p.quantity || 0) * (p.price || 0)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const opt = {
    margin: 10,
    filename: `inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(opt).from(element).save();
  showNotification('✅ PDF report downloaded', 'success');
}


