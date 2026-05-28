# Judol Detector

![Judol Detector](test/image/judol-5.png)

Judol Detector adalah Chromium browser extension berbasis TypeScript untuk mendeteksi konten judi online pada halaman web. Aplikasi ini menjalankan pencocokan exact, regex, fuzzy matching, highlight DOM, tooltip, popup statistik realtime, blur teks, dan OCR pada gambar.

## Fitur Program

- Deteksi exact matching menggunakan KMP dan Boyer-Moore dari `keywords/keywords.txt`.
- Deteksi pola umum `<kata><angka>` menggunakan RegEx.
- Deteksi karakter manipulatif atau mirip visual menggunakan weighted Levenshtein distance.
- Bonus engine: Aho-Corasick dan Rabin-Karp.
- Highlight elemen DOM yang terdeteksi tanpa merusak layout.
- Tooltip custom saat hover pada elemen terdeteksi.
- Popup statistik realtime untuk jumlah match dan waktu eksekusi algoritma.
- Toggle blur teks untuk menyamarkan konten yang terdeteksi.
- OCR pada gambar untuk mendeteksi teks judol yang tersembunyi di image.

## Struktur Project

```text
judol-detector/
├── public/
│   ├── manifest.json
│   └── images/
├── src/
│   ├── algorithms/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── styles/
│   └── types/
├── keywords/
│   └── keywords.txt
├── test/
│   └── image/
├── doc/
└── spesifikasi/
```

## Penjelasan Singkat Algoritma KMP dan Boyer-Moore

### KMP

KMP melakukan pencocokan string dengan memanfaatkan failure function atau prefix table. Saat terjadi mismatch, algoritma tidak mengulang pencarian dari awal, melainkan melompat ke prefiks terpanjang yang masih relevan. Implementasi di repo ini dibuat from scratch dan menghitung jumlah comparison secara manual.

### Boyer-Moore

Boyer-Moore mencocokkan pattern dari kanan ke kiri dan memanfaatkan dua heuristik utama: bad character melalui last occurrence table, serta good suffix melalui border/good suffix table. Saat mismatch, pattern digeser sejauh mungkin berdasarkan dua heuristik tersebut. Implementasi di repo ini juga dibuat from scratch dan menghitung comparison secara manual.

## Requirement Program

- Node.js 18 atau lebih baru.
- npm.
- Browser berbasis Chromium, seperti Google Chrome atau Microsoft Edge.

## Instalasi

```bash
npm install
```

## Build Project

```bash
npm run build
```

Hasil build akan tersimpan di folder `dist/`.

## Cara Load Extension di Chrome

1. Buka `chrome://extensions/`.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**.
4. Pilih folder `dist/` dari project ini.
5. Buka halaman web target, lalu gunakan popup extension untuk memulai scan.

## How to Contribute

1. Buat branch baru untuk perubahan yang ingin dikerjakan.
2. Jalankan `npm install` jika dependency belum terpasang.
3. Lakukan perubahan secukupnya dan tetap ikuti struktur kode yang sudah ada.
4. Pastikan project lolos build dengan `npm run build`.
5. Jika relevan, jalankan `npm run typecheck` sebelum membuat pull request.
6. Kirim pull request dengan ringkasan perubahan yang jelas.

## Author

- Vincent Rionarlie (13524031)
- Jason Edward Salim (13524034)
- Muhammad Aufar Rizqi Kusuma (13524061)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
