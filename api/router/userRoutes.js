const express = require('express');

const router = express.Router();

const db = require('../config/db');


// ======================================
// GET: LẤY DANH SÁCH NGƯỜI DÙNG
// GET /api/users
// ======================================

router.get('/', async (req, res) => {
    try {

        const [users] = await db.query(`
            SELECT 
                id,
                username,
                full_name,
                email,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách người dùng thành công',
            total: users.length,
            users: users
        });

    } catch (error) {

        console.error('Get users error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});


// ======================================
// GET: LẤY THÔNG TIN NGƯỜI DÙNG THEO ID
// GET /api/users/:id
// ======================================

router.get('/:id', async (req, res) => {
    try {

        const { id } = req.params;

        const [users] = await db.query(`
            SELECT 
                id,
                username,
                full_name,
                email,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin người dùng thành công',
            user: users[0]
        });

    } catch (error) {

        console.error('Get user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});


// ======================================
// PATCH: CẬP NHẬT THÔNG TIN NGƯỜI DÙNG
// PATCH /api/users/:id
// ======================================

router.patch('/:id', async (req, res) => {
    try {

        const { id } = req.params;
        const { username, full_name } = req.body;


        // Kiểm tra có ít nhất một trường cần cập nhật

        if (username === undefined && full_name === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập ít nhất một trường cần cập nhật'
            });
        }


        // Kiểm tra người dùng có tồn tại không

        const [existingUsers] = await db.query(`
            SELECT 
                id,
                username,
                full_name,
                email
            FROM users
            WHERE id = ?
        `, [id]);


        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }


        // Tạo câu SQL UPDATE

        const updateFields = [];
        const updateValues = [];


        if (username !== undefined) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }


        if (full_name !== undefined) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }


        updateFields.push('updated_at = CURRENT_TIMESTAMP');


        // Thêm id vào cuối để WHERE id = ?

        updateValues.push(id);


        const sql = `
            UPDATE users
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;


        await db.query(sql, updateValues);


        // Lấy lại dữ liệu sau khi cập nhật

        const [updatedUsers] = await db.query(`
            SELECT 
                id,
                username,
                full_name,
                email,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `, [id]);


        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công',
            user: updatedUsers[0]
        });

    } catch (error) {

        console.error('Update user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật người dùng',
            error: error.message
        });
    }
});


// ======================================
// DELETE: XÓA NGƯỜI DÙNG
// DELETE /api/users/:id
// ======================================

router.delete('/:id', async (req, res) => {
    try {

        const { id } = req.params;


        // Kiểm tra người dùng có tồn tại không

        const [existingUsers] = await db.query(`
            SELECT 
                id,
                username,
                full_name,
                email
            FROM users
            WHERE id = ?
        `, [id]);


        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }


        // Xóa người dùng

        await db.query(`
            DELETE FROM users
            WHERE id = ?
        `, [id]);


        return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công',
            user: existingUsers[0]
        });

    } catch (error) {

        console.error('Delete user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa người dùng',
            error: error.message
        });
    }
});


module.exports = router;