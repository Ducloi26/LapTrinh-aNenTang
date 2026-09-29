const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const db = require('../config/db');


// ======================================
// POST: ĐĂNG KÝ TÀI KHOẢN
// POST /api/auth/register
// ======================================

router.post('/register', async (req, res) => {
    try {
        const {
            username,
            full_name,
            email,
            password
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ username, full_name, email và password'
            });
        }

        // Kiểm tra mật khẩu
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Kiểm tra username hoặc email đã tồn tại
        const [existingUsers] = await db.query(
            `
            SELECT id, username, email
            FROM users
            WHERE username = ? OR email = ?
            `,
            [username, email]
        );

        if (existingUsers.length > 0) {

            if (existingUsers.some(user => user.username === username)) {
                return res.status(400).json({
                    success: false,
                    message: 'Username đã tồn tại'
                });
            }

            if (existingUsers.some(user => user.email === email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại'
                });
            }
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm user vào MySQL
        const [result] = await db.query(
            `
            INSERT INTO users
                (username, full_name, email, password)
            VALUES
                (?, ?, ?, ?)
            `,
            [
                username,
                full_name,
                email,
                hashedPassword
            ]
        );

        // Lấy user vừa tạo
        const [users] = await db.query(
            `
            SELECT
                id,
                username,
                full_name,
                email,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            user: users[0]
        });

    } catch (error) {
        console.error('Register error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký tài khoản',
            error: error.message
        });
    }
});


// ======================================
// POST: ĐĂNG NHẬP
// POST /api/auth/login
// ======================================

router.post('/login', async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và password'
            });
        }

        // Tìm user theo email
        const [users] = await db.query(
            `
            SELECT
                id,
                username,
                full_name,
                email,
                password,
                created_at,
                updated_at
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        // Không tìm thấy user
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const user = users[0];

        // Kiểm tra password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Không trả password về client
        delete user.password;

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user: user
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: error.message
        });
    }
});


module.exports = router;