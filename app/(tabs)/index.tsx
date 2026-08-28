import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyApp() {
  const [hoTen, setHoTen] = useState('');
  const [mssv, setMssv] = useState('');
  const [email, setEmail] = useState('');
  const [sdt, setSdt] = useState('');
  const [matKhau, setMatKhau] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, justifyContent: 'center' }}>
      <KeyboardAvoidingView style={{ width: '100%' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
          Thông tin sinh viên
        </Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Họ và tên</Text>
          <TextInput
            style={{ height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10 }}
            placeholder="Nhập họ và tên"
            value={hoTen}
            onChangeText={setHoTen}
          />
          {hoTen.trim() === '' && (
            <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Họ tên không được để trống</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Mã sinh viên</Text>
          <TextInput
            style={{ height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10 }}
            placeholder="Nhập mã sinh viên"
            value={mssv}
            onChangeText={setMssv}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Email</Text>
          <TextInput
            style={{ height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10 }}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
          />
          {email.trim() === '' && (
            <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Email không được để trống</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Số điện thoại</Text>
          <TextInput
            style={{ height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10 }}
            placeholder="Nhập số điện thoại"
            value={sdt}
            onChangeText={(text) => setSdt(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Mật khẩu</Text>
          <TextInput
            style={{ height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10 }}
            placeholder="Nhập mật khẩu"
            value={matKhau}
            onChangeText={setMatKhau}

          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}