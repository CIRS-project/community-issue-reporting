const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/resident-login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resident-login.html')));
app.get('/resident-register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resident-register.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin-login.html')));
app.get('/admin-register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin-register.html')));
app.get('/complaint', (req, res) => res.sendFile(path.join(__dirname, 'views', 'complaint.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'views', 'track.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
