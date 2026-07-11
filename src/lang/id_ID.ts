export default {
  // 路由国际化
  route: {
    dashboard: 'Dasbor',
    document: 'Dokumen'
  },
  // 登录页面国际化
  login: {
    username: 'Nama Pengguna',
    password: 'Kata Sandi',
    login: 'Masuk',
    logging: 'Memasuki...',
    code: 'Kode Verifikasi',
    rememberPassword: 'Ingat saya',
    switchRegisterPage: 'Daftar sekarang',
    rule: {
      username: {
        required: 'Silakan masukkan akun Anda'
      },
      password: {
        required: 'Silakan masukkan kata sandi Anda'
      },
      code: {
        required: 'Silakan masukkan kode verifikasi'
      }
    },
    social: {
      wechat: 'Login WeChat',
      maxkey: 'Login MaxKey',
      topiam: 'Login TopIam',
      gitee: 'Login Gitee',
      github: 'Login Github'
    }
  },
  // 注册页面国际化
  register: {
    username: 'Nama Pengguna',
    password: 'Kata Sandi',
    confirmPassword: 'Konfirmasi Kata Sandi',
    register: 'Daftar',
    registering: 'Mendaftar...',
    registerSuccess: 'Selamat, akun {username} Anda telah terdaftar!',
    code: 'Kode Verifikasi',
    switchLoginPage: 'Masuk dengan akun yang ada',
    rule: {
      username: {
        required: 'Silakan masukkan akun Anda',
        length: 'Panjang akun harus antara {min} dan {max}'
      },
      password: {
        required: 'Silakan masukkan kata sandi Anda',
        length: 'Panjang kata sandi harus antara {min} dan {max}',
        pattern: 'Tidak boleh mengandung karakter ilegal: {strings}'
      },
      code: {
        required: 'Silakan masukkan kode verifikasi'
      },
      confirmPassword: {
        required: 'Silakan masukkan kata sandi Anda lagi',
        equalToPassword: 'Kata sandi yang dimasukkan tidak cocok'
      }
    }
  },
  // 导航栏国际化
  navbar: {
    full: 'Layar Penuh',
    language: 'Bahasa',
    dashboard: 'Dasbor',
    document: 'Dokumen',
    message: 'Pesan',
    layoutSize: 'Ukuran Tata Letak',
    layoutSetting: 'Pengaturan Tata Letak',
    personalCenter: 'Pusat Personal',
    logout: 'Keluar'
  }
};
