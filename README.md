# 🎨 Project Monet

**A Beautiful Student Budget Financial Tracker**

Project Monet is a full-stack web application designed to help students track their finances with style. Built with Material 3 Expressive design principles, rich typography, and advanced data visualizations.

## ✨ Features

### Core Functionality
- **User Registration & Authentication**: Secure account creation with password hashing (PBKDF2-SHA256)
- **Transaction Management**: Full CRUD operations for income and expenses
- **Budget Tracking**: Set monthly budgets and monitor spending
- **Savings Goals**: Create and track progress towards financial goals

### Data Visualization (Advanced Feature)
- **Category Breakdown**: Interactive doughnut chart showing spending by category
- **Monthly Trends**: Line chart comparing income vs expenses over 6 months
- **Daily Spending**: Track daily expenses throughout the month
- **Distribution Chart**: Polar area chart for category distribution
- **Smart Insights**: AI-generated insights about your spending habits

### Design
- **Material 3 Expressive Theme**: Modern, vibrant color palette with expressive components
- **Rich Typography**: Playfair Display for headings, DM Sans for body text
- **Glass Morphism**: Beautiful frosted glass card effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Optimized**: Designed with careful attention to contrast and readability

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd project-monet
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```
→ *When you're done, to stop Self-host, just press **CTRL + C***.

## 📁 Project Structure

```
project-monet/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── monet.db              # SQLite database (auto-created)
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Material 3 stylesheet
    └── js/
        └── app.js        # Frontend JavaScript application
```

## 🔧 Technologies Used

### Backend
- **Flask**: Lightweight Python web framework
- **SQLite**: Embedded database for data storage
- **Werkzeug**: Password hashing and security utilities

### Frontend
- **HTML5/CSS3**: Semantic markup and modern styling
- **JavaScript (ES6+)**: Interactive functionality
- **Chart.js**: Advanced data visualizations
- **Google Fonts**: Playfair Display, DM Sans, JetBrains Mono
- **Material Icons**: Rounded icon family

## 📊 API Endpoints

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info
- `PUT /api/user/budget` - Update monthly budget

### Transactions
- `GET /api/transactions` - List all transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/<id>` - Get single transaction
- `PUT /api/transactions/<id>` - Update transaction
- `DELETE /api/transactions/<id>` - Delete transaction

### Analytics
- `GET /api/analytics/summary` - Monthly summary
- `GET /api/analytics/trends` - 6-month trends
- `GET /api/analytics/daily` - Daily spending

### Savings Goals
- `GET /api/savings-goals` - List all goals
- `POST /api/savings-goals` - Create goal
- `PUT /api/savings-goals/<id>` - Update goal
- `DELETE /api/savings-goals/<id>` - Delete goal

## 🎨 Design Philosophy

Project Monet is named after the famous impressionist painter Claude Monet. Just as Monet painted beautiful landscapes with light and color, this app helps you "paint" your financial future with clarity and beauty.

The design follows these principles:
1. **Expressive Color**: Rich purples, teals, and golds create an engaging experience
2. **Typography First**: Beautiful fonts make data easy to read
3. **Glass Morphism**: Modern frosted glass effects add depth
4. **Motion & Delight**: Subtle animations enhance interactions
5. **Accessibility**: High contrast and readable text for all users

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px - Full sidebar, all features visible
- **Tablet**: 768px - 1024px - Collapsible sidebar
- **Mobile**: < 768px - Hamburger menu, stacked layouts

## 🔒 Security Features

- Password hashing with PBKDF2-SHA256
- Session-based authentication
- CSRF protection via Flask
- SQL injection prevention through parameterized queries
- Input validation on both client and server

## 📝 License

This project was created as an educational exercise. Feel free to use and modify for your own learning purposes.

---

**Created by Xenometon, with ❤️ for students who want to take control of their finances**
