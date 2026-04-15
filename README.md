# Inventory Tracker

A modern, full-stack inventory management system for tracking products, stock levels, and supplier information. Built for deployment on Vercel with a responsive, professional dashboard featuring real-time analytics, reporting, and data visualization.

## ✨ Features

### Core Functionality
- ✅ Full CRUD operations for products
- ✅ Real-time inventory tracking with low-stock alerts
- ✅ Product categorization and tagging
- ✅ Advanced search and filtering capabilities

### Dashboard & Analytics
- 📊 Multi-view dashboard (Dashboard, Products, Analytics, Reports)
- 📈 Interactive charts with Chart.js (Sales, Stock Levels, Categories)
- 📋 Analytics view with search, filter, and sort functionality
- 📅 Reports view with date-range filtering
- 🔔 Real-time low-stock notifications

### User Experience
- 🌙 Dark mode with professional color scheme
- 📱 Fully responsive design (mobile-friendly)
- 🎨 Modern sidebar navigation
- 🔄 Grid/table view toggle for products
- 📊 Data export (CSV and PDF formats)

### Advanced Features
- 🔐 Professional UI with smooth animations
- ⚡ Smooth view transitions and loading states
- 📲 Toast-style notifications (info, warning, error, success)
- 💾 Automatic data persistence
- 🚀 Optimized for Vercel serverless deployment

## 🏗️ Project Structure

```
inventory-tracker/
├── index.js              # Express server & API routes
├── package.json          # Dependencies
├── vercel.json          # Vercel deployment config
├── api/
│   └── index.js         # API entry point for Vercel
├── backend/
│   ├── app.py           # Python/Flask reference
│   ├── models.py        # Database models reference
│   ├── routes.py        # Routes reference
│   └── server.js        # Alternative server setup
├── database/
│   └── schema.sql       # Database schema
├── frontend/
│   ├── index.html       # Main dashboard UI
│   ├── script.js        # Interactive functionality
│   └── style.css        # Styling with dark mode support
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.x or higher
- **npm** (comes with Node.js)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/laserarts/inventory-tracker.git
cd inventory-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

The application will start on `http://localhost:3000`

### First Run
- The database is auto-initialized with 12 sample products on first run
- No additional setup required

## 🎨 Usage

### Dashboard Views

**Dashboard View**
- Overview of key metrics (Total Products, Total Stock, Low Stock Items)
- Visual charts for sales trends and stock distribution
- Recent activity section

**Products View**
- Browse all products in grid or table layout
- Add new products via modal form
- Edit/delete existing products
- View product details and stock levels
- Filter by category

**Analytics View**
- Search and filter products by name, SKU, or category
- Sort by various columns
- View detailed product information

**Reports View**
- Date-range filtering for custom reports
- Generate PDF or CSV exports
- Track historical data

### Dark Mode
Click the dark mode toggle button in the sidebar footer to switch between light and professional dark themes. Preference is saved in browser local storage.

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Styling with CSS variables for theming
- **Vanilla JavaScript** - Interactive features (no frameworks)
- **Chart.js** - Data visualization (4 chart types)
- **html2pdf** - PDF export functionality

### Backend
- **Node.js** v24.x - JavaScript runtime
- **Express.js** v4.18.2 - Web framework
- **SQLite3** - Lightweight database
- **Body-parser** - Request parsing
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Serverless deployment platform
- **GitHub** - Source control & auto-deploy integration

## 📡 API Endpoints

```
GET    /api/products           # List all products
GET    /api/products/:id       # Get product by ID
POST   /api/products           # Create new product
PUT    /api/products/:id       # Update product
DELETE /api/products/:id       # Delete product
GET    /api/categories         # Get all categories
GET    /api/stats              # Get dashboard statistics
```

## 🌐 Deployment to Vercel

### Automatic Deployment
1. Push changes to GitHub
2. Vercel automatically builds and deploys from the `main` branch
3. Your app is live at: `https://inventory-tracker-<your-username>.vercel.app`

### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🗄️ Database

- Uses **SQLite 3** stored at `/tmp/inventory.db` (Vercel compatible)
- Auto-initializes with 12 dummy products on first run
- Includes sample data across multiple categories

### Sample Products
Laptop, Wireless Mouse, USB-C Cable, Office Chair, Desk Lamp, Notebook, Coffee Maker, T-Shirt, Jeans, Apple, Coffee Beans, Desk Organizer

## 📋 Environment Variables

No environment variables required for basic setup. Database uses `/tmp` for Vercel compatibility.

## 🎓 Key JavaScript Functions

- `switchView(viewName)` - Switch between dashboard views
- `toggleDarkMode()` - Toggle dark/light theme
- `addProduct()` - Add new product
- `editProduct(id)` - Edit existing product
- `deleteProduct(id)` - Delete product
- `searchProducts()` - Filter products
- `generatePDF()` - Export report as PDF
- `showNotification(message, type)` - Display notification

## 🐛 Troubleshooting

### Server won't start
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Restart
node index.js
```

### Database issues
Delete `/tmp/inventory.db` to reset the database (it will auto-reinitialize)

### Port 3000 already in use
```bash
node index.js --port 3001
```

## 📝 License

MIT

## 👤 Author

Created with ❤️ for inventory management

## 🌟 Contributing

Feel free to fork this repository and submit pull requests for any improvements.

---

**Live Demo:** [View on Vercel](https://inventory-tracker-erps-ystems.vercel.app)  
**Repository:** [GitHub](https://github.com/laserarts/inventory-tracker)
