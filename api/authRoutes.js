const express = require("express");

const router = express.Router();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY trong api/.env",
  );
}

router.post("/register", async (req, res) => {
  const { display_name, email, password } = req.body ?? {};

  if (
    typeof display_name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !display_name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập tên hiển thị, email và mật khẩu",
    });
  }

  if (display_name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Tên hiển thị không được vượt quá 100 ký tự",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu cần tối thiểu 8 ký tự",
    });
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        data: { display_name: display_name.trim() },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await authResponse.json();

    if (!authResponse.ok) {
      const errorCode = String(
        data.code ?? data.error_code ?? "",
      ).toLowerCase();
      const upstreamMessage = String(
        data.msg ?? data.message ?? data.error_description ?? "",
      );
      const errorMessage = upstreamMessage.toLowerCase();
      const alreadyRegistered =
        errorCode.includes("already") ||
        errorMessage.includes("already registered");
      let status = authResponse.status;
      let message = "Supabase từ chối đăng ký";

      if (alreadyRegistered) {
        status = 409;
        message = "Email này đã được đăng ký";
      } else if (authResponse.status === 429) {
        message =
          "Supabase giới hạn số lần đăng ký hoặc gửi email. Vui lòng thử lại sau";
      } else if (
        errorCode.includes("password") ||
        errorMessage.includes("password")
      ) {
        status = 400;
        message = "Mật khẩu không đáp ứng chính sách bảo mật của Supabase";
      } else if (authResponse.status === 401 || authResponse.status === 403) {
        status = 502;
        message = "Supabase từ chối API key hoặc chưa bật đăng ký email";
      } else if (errorMessage.includes("email")) {
        status = 400;
        message = "Supabase không chấp nhận địa chỉ email này";
      } else if (authResponse.status < 500) {
        status = 400;
        message = "Supabase từ chối thông tin đăng ký";
      } else {
        status = 502;
      }

      return res.status(status).json({
        success: false,
        message,
        code: errorCode || undefined,
        details: upstreamMessage || undefined,
      });
    }

    const user = data.user ?? data;

    if (!user.id || !user.email) {
      return res.status(502).json({
        success: false,
        message: "Supabase trả về phản hồi đăng ký không hợp lệ",
      });
    }

    const hasSession = Boolean(data.access_token && data.refresh_token);

    return res.status(201).json({
      success: true,
      message: hasSession
        ? "Đăng ký tài khoản thành công"
        : "Đăng ký thành công. Vui lòng xác minh email",
      requires_email_confirmation: !hasSession,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name ?? display_name.trim(),
        created_at: user.created_at,
      },
      session: hasSession
        ? {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            token_type: data.token_type,
          }
        : null,
    });
  } catch (error) {
    console.error("Register request failed:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký tài khoản",
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập email và mật khẩu",
    });
  }

  try {
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const data = await authResponse.json();

    if (!authResponse.ok) {
      const status =
        authResponse.status === 400 || authResponse.status === 401 ? 401 : 502;
      return res.status(status).json({
        success: false,
        message:
          status === 401
            ? "Email hoặc mật khẩu không chính xác"
            : "Không thể xác thực với Supabase",
      });
    }

    if (!data.user || !data.access_token || !data.refresh_token) {
      return res.status(502).json({
        success: false,
        message: "Supabase trả về phản hồi đăng nhập không hợp lệ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
      },
    });
  } catch (error) {
    console.error("Login request failed:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
    });
  }
});

module.exports = router;
