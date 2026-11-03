const crypto = require('crypto');

function createServerAuth({ database, jwtSecret, verifyJWT,
  onError = (entry) => console.error('[AUTH_DB]', JSON.stringify(entry)) }) {
  function ready() {
    if (!database || !jwtSecret || jwtSecret.length < 32) {
      const error = new Error('Backend cần SUPABASE_SECRET_KEY (hoặc SUPABASE_SERVICE_ROLE_KEY) và JWT_SECRET tối thiểu 32 ký tự trong backend/.env.');
      error.code = 'SERVER_AUTH_NOT_CONFIGURED';
      throw error;
    }
  }

  async function account(query, operation) {
    let result;
    try { result = await query; }
    catch {
      const error = new Error('Không thể kết nối database tài khoản.');
      error.code = 'ACCOUNT_DB_UNAVAILABLE';
      error.operation = operation;
      error.dbCode = 'NETWORK_ERROR';
      throw error;
    }
    if (result.error) {
      const dbCode = /^[A-Z0-9_]{1,40}$/.test(result.error.code || '') ? result.error.code : `HTTP_${result.status || 'UNKNOWN'}`;
      const failure = new Error('Không thể truy cập bảng tài khoản trên database.');
      failure.code = result.status === 401 || ['PGRST301', 'PGRST302', 'PGRST303'].includes(dbCode)
        ? 'SERVER_DB_KEY_REJECTED'
        : dbCode === '42501' || result.status === 403 ? 'ACCOUNT_DB_PERMISSION_DENIED'
          : ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(dbCode) ? 'ACCOUNT_DB_SCHEMA_MISMATCH'
            : dbCode === '23505' ? 'ACCOUNT_ALREADY_EXISTS' : 'ACCOUNT_DB_UNAVAILABLE';
      failure.operation = operation;
      failure.dbCode = dbCode;
      throw failure;
    }
    return result.data;
  }

  function respondError(res, error, operation) {
    const errors = {
      SERVER_AUTH_NOT_CONFIGURED: [503, 'Backend cần khóa server Supabase và JWT_SECRET riêng tối thiểu 32 ký tự trong backend/.env.'],
      SERVER_DB_KEY_REJECTED: [503, 'Supabase từ chối khóa server. Kiểm tra Secret key/service_role và URL có thuộc cùng project, sau đó khởi động lại backend.'],
      ACCOUNT_DB_PERMISSION_DENIED: [503, 'Kết nối server chưa có quyền truy cập app_users. Kiểm tra loại khóa server và quyền bảng.'],
      ACCOUNT_DB_SCHEMA_MISMATCH: [503, 'Không tìm thấy bảng/cột tài khoản đúng schema. Kiểm tra app_users và project Supabase đang kết nối.'],
      ACCOUNT_ALREADY_EXISTS: [409, 'Email đã được đăng ký. Vui lòng đăng nhập.'],
      ACCOUNT_DB_UNAVAILABLE: [503, 'Không thể truy cập database tài khoản. Vui lòng kiểm tra kết nối và thử lại.'],
      ACCOUNT_PASSWORD_INVALID: [500, 'Dữ liệu mật khẩu của tài khoản không đúng định dạng hỗ trợ. Cần kiểm tra dữ liệu tài khoản.'],
      INVALID_SESSION: [401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'],
      ACCOUNT_NOT_IN_DATABASE: [401, 'Tài khoản không còn tồn tại trên database. Vui lòng đăng nhập lại.'],
      AUTH_FAILED: [500, 'Không thể hoàn tất xác thực. Vui lòng thử lại.'],
    };
    const code = Object.hasOwn(errors, error?.code) ? error.code : 'AUTH_FAILED';
    const [status, message] = errors[code];
    const dbCode = /^[A-Z0-9_]{1,40}$/.test(error?.dbCode || '') ? error.dbCode : 'UNKNOWN';
    const step = ['account_lookup', 'account_create', 'account_verify', 'password_verify', 'jwt_sign', 'auth_config'].includes(error?.operation)
      ? error.operation : operation;
    onError({ operation: step, code, dbCode });
    return res.status(status).json({ success: false, code, dbCode, operation: step, error: message });
  }

  return {
    respondError,
    async authenticate(token) {
      ready();
      let claims;
      try { claims = verifyJWT(token, jwtSecret); } catch {}
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims?.id || '')) {
        const error = new Error('Invalid session');
        error.code = 'INVALID_SESSION';
        throw error;
      }
      const row = await account(database.from('app_users').select('id,email,display_name,role')
        .eq('id', claims.id).maybeSingle(), 'account_verify');
      if (!row) {
        const error = new Error('Account not found');
        error.code = 'ACCOUNT_NOT_IN_DATABASE';
        throw error;
      }
      return { database, user: { id: row.id, email: row.email, displayName: row.display_name,
        role: row.role === 'admin' ? 'admin' : 'user' } };
    },
    middleware(req, res, next) {
      try { ready(); next(); }
      catch (error) { respondError(res, error, 'auth_config'); }
    },
    verifyToken(token) {
      ready();
      return verifyJWT(token, jwtSecret);
    },
    async databaseForUser(user) {
      ready();
      const row = await account(database.from('app_users').select('id').eq('id', user.id).maybeSingle(), 'account_verify');
      if (!row) {
        const error = new Error('Tài khoản chưa tồn tại trong app_users trên database. Tài khoản chỉ lưu local không dùng để ghi cloud.');
        error.code = 'ACCOUNT_NOT_IN_DATABASE';
        throw error;
      }
      return database;
    },
    async findUserByEmail(email) {
      ready();
      if (typeof email !== 'string') throw new Error('Email không hợp lệ.');
      return account(database.from('app_users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle(), 'account_lookup');
    },
    async createUser({ email, passwordHash, displayName, role = 'user' }) {
      ready();
      const user = {
        id: crypto.randomUUID(), email: email.trim().toLowerCase(), password_hash: passwordHash,
        display_name: displayName || 'Người nghe', role: role === 'admin' ? 'admin' : 'user',
      };
      return account(database.from('app_users').insert(user).select().single(), 'account_create');
    },
  };
}

module.exports = { createServerAuth };
