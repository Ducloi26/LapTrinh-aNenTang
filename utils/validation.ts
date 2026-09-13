export function validateLogin(values: { email: string; password: string }) {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Email không hợp lệ.';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  }

  return errors;
}

export function validateRegister(values: {
  name: string;
  email: string;
  password: string;
  confirm: string;
  agree: boolean;
}) {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Vui lòng nhập tên hiển thị.';
  }

  if (!values.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Email không hợp lệ.';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (values.password.length < 8) {
    errors.password = 'Mật khẩu cần tối thiểu 8 ký tự.';
  }

  if (values.confirm !== values.password) {
    errors.confirm = 'Mật khẩu xác nhận chưa khớp.';
  }

  if (!values.agree) {
    errors.agree = 'Bạn cần đồng ý với điều khoản để tiếp tục.';
  }

  return errors;
}

export function getPasswordStrength(password: string) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const colors = ['#FB7185', '#FBBF24', '#67E8F9', '#4ADE80'];
  const index = Math.max(0, score - 1);

  return { score, label: labels[index], color: colors[index], index };
}
