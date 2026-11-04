const APP_URL = 'https://app8984347139.tgcloud.ai/';
const SOURCE_URL = 'https://github.com/Yoganataa/openchamber-miniapp';

const paragraph = (text) => ({ type: 'paragraph', text });
const heading = (text, size = 2) => ({ type: 'heading', size, text });
const detail = (summary, blocks) => ({ type: 'details', summary, blocks });
const list = (...items) => ({
  type: 'list',
  items: items.map((text) => ({ blocks: [paragraph(text)] })),
});

export const buildWelcomeRichMessage = ({ firstName, hasInstance }) => {
  const displayName = typeof firstName === 'string' && firstName.trim()
    ? firstName.trim().slice(0, 64)
    : 'there';

  const instanceStatus = hasInstance
    ? 'Akun Telegram ini sudah memiliki satu instance OpenChamber yang terdaftar.'
    : 'Belum ada instance yang terdaftar untuk akun Telegram ini. Hubungkan server milikmu dari Mini App.';

  return {
    blocks: [
      heading(`Halo, ${displayName}!`, 1),
      paragraph([
        { type: 'bold', text: 'OpenChamber Mini App' },
        ' menghubungkan Telegram dengan OpenChamber Server yang kamu jalankan sendiri.',
      ]),
      paragraph(instanceStatus),
      {
        type: 'expandable_blockquote',
        text: 'Satu akun Telegram hanya memiliki satu instance. Identitas pemilik diverifikasi oleh Telegram Serverless; membuka Mini App dari akun Telegram lain tidak memberikan akses ke instance akun ini.',
      },
      {
        type: 'divider',
      },
      heading('Mulai menggunakan', 2),
      list(
        'Jalankan OpenChamber Server pada perangkat atau server milikmu.',
        'Buka Mini App dan pilih Scan QR code.',
        'Di OpenChamber, buka Settings → Remote Instances → Add a device, lalu pilih Anywhere jika ingin menggunakan Private Relay.',
        'Pairing membuat credential khusus perangkat. Perangkat baru mungkin perlu melakukan pairing atau autentikasi tersendiri.',
      ),
      detail('Ketentuan Layanan (Terms of Service)', [
        paragraph('Versi 1.0 · 4 November 2026'),
        paragraph('Dengan menggunakan Mini App, kamu bertanggung jawab memastikan bahwa server OpenChamber yang dihubungkan berada dalam kendalimu atau kamu memiliki izin dari pemiliknya.'),
        list(
          'Jangan gunakan layanan untuk mengakses sistem, file, atau akun tanpa izin.',
          'Kamu bertanggung jawab atas keamanan OpenChamber Server, kata sandi, perangkat yang dipasangkan, jaringan, dan backup milikmu.',
          'Mini App adalah antarmuka dan penghubung. OpenChamber Server, OpenCode, tools, filesystem, dan proses kerja tetap berjalan pada lingkungan server yang kamu kelola.',
          'Ketersediaan koneksi bergantung pada Telegram, jaringan, perangkat, OpenChamber Server, dan layanan relay yang digunakan. Tidak ada jaminan uptime tanpa gangguan.',
          'Jangan membagikan QR pairing, connection link, password, atau token perangkat kepada orang yang tidak dipercaya.',
          'Akses perangkat yang sudah pernah dipasangkan harus dicabut dari Settings → Remote Instances pada OpenChamber Server. Menghapus mapping akun Telegram tidak otomatis mencabut token yang telah diterbitkan server.',
        ),
        paragraph('Penggunaan yang melanggar hukum, mengganggu layanan, atau melanggar hak pihak lain tidak diperbolehkan.'),
      ]),
      detail('Kebijakan Privasi (Privacy Policy)', [
        paragraph('Versi 1.0 · 4 November 2026'),
        paragraph('Backend menyimpan data minimum untuk mengisolasi kepemilikan instance berdasarkan identitas Telegram yang telah diverifikasi.'),
        list(
          'Telegram user ID disimpan sebagai primary key pemilik instance.',
          'Data instance yang disimpan: instance ID, label, server ID, alamat transport direct/Private Relay, public encryption key relay, dan waktu pembuatan/perubahan.',
          'Kata sandi OpenChamber dan client token perangkat tidak dikirim ke SQLite Serverless.',
          'Client token disimpan pada perangkat dalam Telegram SecureStorage bila didukung; jika tidak, token hanya berada di storage lokal yang diisolasi per akun Telegram.',
          'Raw initData Telegram hanya digunakan platform untuk memverifikasi request endpoint. Aplikasi tidak menyimpan raw initData.',
          'Data instance digunakan untuk memuat koneksi milik akun yang sedang terautentikasi, bukan untuk membagikan server ke pengguna lain.',
        ),
        paragraph('Saat instance dihapus dari Mini App, mapping Telegram user ID di database dihapus. Credential perangkat yang sebelumnya diterbitkan OpenChamber Server tetap harus dicabut dari server tersebut.'),
        paragraph('Jangan masukkan informasi sensitif ke label instance. Alamat jaringan dan metadata relay dapat mengungkap informasi teknis tentang servermu.'),
      ]),
      detail('FAQ — Pertanyaan yang Sering Diajukan', [
        detail('Apakah bot meng-host OpenChamber Server?', [
          paragraph('Tidak. Bot hanya menyediakan Mini App dan database untuk menyimpan mapping akun Telegram. OpenChamber Server tetap berjalan pada mesin yang kamu kelola.'),
        ]),
        detail('Kenapa akun Telegram teman tidak melihat serverku?', [
          paragraph('Setiap endpoint mengambil Telegram user ID dari initData yang diverifikasi Telegram. Database hanya mengembalikan instance untuk user ID tersebut. Akun lain harus menghubungkan servernya sendiri.'),
        ]),
        detail('Kenapa harus pairing lagi di perangkat baru?', [
          paragraph('Mapping instance disimpan di SQLite, tetapi client token adalah credential perangkat. Perangkat baru tidak otomatis menerima token perangkat lama. Gunakan pairing atau autentikasi server untuk mendaftarkan perangkat baru.'),
        ]),
        detail('Apakah menghapus instance mencabut semua akses?', [
          paragraph('Tidak otomatis. Penghapusan menghapus mapping akun dari database dan koneksi lokal akun tersebut. Untuk mencabut perangkat yang pernah diotorisasi, buka Remote Instances pada OpenChamber Server dan revoke perangkat terkait.'),
        ]),
        detail('Di mana data disimpan?', [
          paragraph('Mapping instance berada pada SQLite yang disediakan Telegram Serverless. Credential perangkat berada di storage lokal Telegram sesuai dukungan platform.'),
        ]),
        detail('Bagaimana cara menghapus instance?', [
          paragraph('Buka Mini App, masuk ke pengelolaan koneksi, lalu hapus koneksi. Backend akan menghapus mapping untuk akun Telegram yang sedang aktif.'),
        ]),
      ]),
      {
        type: 'buttons',
        align: 'center',
        buttons: [
          {
            text: 'Buka OpenChamber',
            style: 'success',
            web_app: { url: APP_URL },
          },
          {
            text: 'Source Code',
            url: SOURCE_URL,
          },
        ],
      },
      {
        type: 'footer',
        text: 'OpenChamber Mini App · Telegram Serverless · Privacy by account ownership',
      },
    ],
  };
};
