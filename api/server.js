const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./router/authRoutes');
const userRoutes = require('./router/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API đang chạy'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});