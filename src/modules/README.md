# Modul bisnis

Setiap fitur project diletakkan di `src/modules/{nama-modul}/` dengan struktur:

```text
src/modules/{nama-modul}/
├── components/     # halaman dan dialog
├── services/       # pemanggilan API
├── types.ts        # tipe data modul
├── hooks/          # opsional
└── utils/          # opsional
```

Route Next.js di `src/app/{nama-modul}` hanya meng-compose halaman dari folder modules.

Contoh siap pakai: `src/modules/example` (list + filter + dialog + export).
