"""
Project Monet - Student Budget Financial Tracker
A beautiful, full-stack web application for managing student finances
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, timedelta
from functools import wraps
import json

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

DATABASE = 'monet.db'

# ============================================
# Database Setup and Utilities
# ============================================

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            monthly_budget REAL DEFAULT 1000.00
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            transaction_type TEXT NOT NULL,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Budget goals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budget_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            month TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Savings goals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ============================================
# Authentication Decorator
# ============================================

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ============================================
# Page Routes
# ============================================

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

# ============================================
# Authentication Routes
# ============================================

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validation
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Hash password securely
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Auto-login after registration
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({
            'message': 'Registration successful',
            'user': {'id': user_id, 'username': username, 'email': email}
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'monthly_budget': user['monthly_budget']
            }
        })
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    """Get current user info"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, monthly_budget, created_at FROM users WHERE id = ?', 
                   (session['user_id'],))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'monthly_budget': user['monthly_budget'],
            'created_at': user['created_at']
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/user/budget', methods=['PUT'])
@login_required
def update_budget():
    """Update user's monthly budget"""
    data = request.get_json()
    monthly_budget = data.get('monthly_budget', 1000)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET monthly_budget = ? WHERE id = ?',
                   (monthly_budget, session['user_id']))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Budget updated', 'monthly_budget': monthly_budget})

# ============================================
# Transaction Routes (CRUD)
# ============================================

@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    """Get all transactions for current user"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get query parameters for filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    transaction_type = request.args.get('type')
    
    query = 'SELECT * FROM transactions WHERE user_id = ?'
    params = [session['user_id']]
    
    if start_date:
        query += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        query += ' AND date <= ?'
        params.append(end_date)
    if category:
        query += ' AND category = ?'
        params.append(category)
    if transaction_type:
        query += ' AND transaction_type = ?'
        params.append(transaction_type)
    
    query += ' ORDER BY date DESC, created_at DESC'
    
    cursor.execute(query, params)
    transactions = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(t) for t in transactions])

@app.route('/api/transactions', methods=['POST'])
@login_required
def create_transaction():
    """Create a new transaction"""
    data = request.get_json()
    
    amount = data.get('amount')
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    transaction_type = data.get('transaction_type', 'expense')
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    if not amount or not category:
        return jsonify({'error': 'Amount and category are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (user_id, amount, category, description, transaction_type, date)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session['user_id'], amount, category, description, transaction_type, date))
    
    conn.commit()
    transaction_id = cursor.lastrowid
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    transaction = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(transaction)), 201

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
@login_required
def get_transaction(transaction_id):
    """Get a specific transaction"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM transactions WHERE id = ? AND user_id = ?',
                   (transaction_id, session['user_id']))
    transaction = cursor.fetchone()
    conn.close()
    
    if transaction:
        return jsonify(dict(transaction))
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
@login_required
def update_transaction(transaction_id):
    """Update a transaction"""
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check ownership
    cursor.execute('SELECT * FROM transactions WHERE id = ? AND user_id = ?',
                   (transaction_id, session['user_id']))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404
    
    cursor.execute('''
        UPDATE transactions 
        SET amount = ?, category = ?, description = ?, transaction_type = ?, date = ?
        WHERE id = ? AND user_id = ?
    ''', (
        data.get('amount'),
        data.get('category'),
        data.get('description'),
        data.get('transaction_type'),
        data.get('date'),
        transaction_id,
        session['user_id']
    ))
    
    conn.commit()
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    transaction = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(transaction))

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def delete_transaction(transaction_id):
    """Delete a transaction"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?',
                   (transaction_id, session['user_id']))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Transaction deleted'})

# ============================================
# Analytics Routes
# ============================================

@app.route('/api/analytics/summary', methods=['GET'])
@login_required
def get_summary():
    """Get financial summary for current month"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current month's start and end
    today = datetime.now()
    month_start = today.replace(day=1).strftime('%Y-%m-%d')
    
    # Total income this month
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions 
        WHERE user_id = ? AND transaction_type = 'income' AND date >= ?
    ''', (session['user_id'], month_start))
    total_income = cursor.fetchone()['total']
    
    # Total expenses this month
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions 
        WHERE user_id = ? AND transaction_type = 'expense' AND date >= ?
    ''', (session['user_id'], month_start))
    total_expenses = cursor.fetchone()['total']
    
    # Get user's monthly budget
    cursor.execute('SELECT monthly_budget FROM users WHERE id = ?', (session['user_id'],))
    monthly_budget = cursor.fetchone()['monthly_budget']
    
    # Category breakdown for expenses
    cursor.execute('''
        SELECT category, SUM(amount) as total
        FROM transactions 
        WHERE user_id = ? AND transaction_type = 'expense' AND date >= ?
        GROUP BY category
        ORDER BY total DESC
    ''', (session['user_id'], month_start))
    categories = cursor.fetchall()
    
    conn.close()
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': total_income - total_expenses,
        'monthly_budget': monthly_budget,
        'budget_remaining': monthly_budget - total_expenses,
        'budget_percentage': (total_expenses / monthly_budget * 100) if monthly_budget > 0 else 0,
        'category_breakdown': [dict(c) for c in categories]
    })

@app.route('/api/analytics/trends', methods=['GET'])
@login_required
def get_trends():
    """Get spending trends over time"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get last 6 months of data
    months_data = []
    for i in range(5, -1, -1):
        date = datetime.now() - timedelta(days=i*30)
        month_start = date.replace(day=1).strftime('%Y-%m-%d')
        next_month = (date.replace(day=1) + timedelta(days=32)).replace(day=1).strftime('%Y-%m-%d')
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE user_id = ? AND transaction_type = 'expense' 
            AND date >= ? AND date < ?
        ''', (session['user_id'], month_start, next_month))
        expenses = cursor.fetchone()['total']
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE user_id = ? AND transaction_type = 'income' 
            AND date >= ? AND date < ?
        ''', (session['user_id'], month_start, next_month))
        income = cursor.fetchone()['total']
        
        months_data.append({
            'month': date.strftime('%b %Y'),
            'expenses': expenses,
            'income': income,
            'savings': income - expenses
        })
    
    conn.close()
    
    return jsonify(months_data)

@app.route('/api/analytics/daily', methods=['GET'])
@login_required
def get_daily_spending():
    """Get daily spending for current month"""
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now()
    month_start = today.replace(day=1).strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT date, SUM(amount) as total
        FROM transactions 
        WHERE user_id = ? AND transaction_type = 'expense' AND date >= ?
        GROUP BY date
        ORDER BY date
    ''', (session['user_id'], month_start))
    
    daily_data = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(d) for d in daily_data])

# ============================================
# Savings Goals Routes
# ============================================

@app.route('/api/savings-goals', methods=['GET'])
@login_required
def get_savings_goals():
    """Get all savings goals"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
                   (session['user_id'],))
    goals = cursor.fetchall()
    conn.close()
    return jsonify([dict(g) for g in goals])

@app.route('/api/savings-goals', methods=['POST'])
@login_required
def create_savings_goal():
    """Create a new savings goal"""
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        session['user_id'],
        data.get('name'),
        data.get('target_amount'),
        data.get('current_amount', 0),
        data.get('deadline')
    ))
    
    conn.commit()
    goal_id = cursor.lastrowid
    
    cursor.execute('SELECT * FROM savings_goals WHERE id = ?', (goal_id,))
    goal = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(goal)), 201

@app.route('/api/savings-goals/<int:goal_id>', methods=['PUT'])
@login_required
def update_savings_goal(goal_id):
    """Update a savings goal"""
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE savings_goals 
        SET name = ?, target_amount = ?, current_amount = ?, deadline = ?
        WHERE id = ? AND user_id = ?
    ''', (
        data.get('name'),
        data.get('target_amount'),
        data.get('current_amount'),
        data.get('deadline'),
        goal_id,
        session['user_id']
    ))
    
    conn.commit()
    
    cursor.execute('SELECT * FROM savings_goals WHERE id = ?', (goal_id,))
    goal = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(goal))

@app.route('/api/savings-goals/<int:goal_id>', methods=['DELETE'])
@login_required
def delete_savings_goal(goal_id):
    """Delete a savings goal"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
                   (goal_id, session['user_id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Goal deleted'})

# ============================================
# Run Application
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎨 Project Monet - Student Budget Tracker")
    print("="*50)
    print("\n🚀 Starting server at http://localhost:5000")
    print("📊 Database: monet.db")
    print("\nPress Ctrl+C to stop the server\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
