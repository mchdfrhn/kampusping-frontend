# HIS Standard UI/UX

Base frontend resmi **PT. Hino Motors Sales Indonesia** untuk semua project HIS baru.

Stack: **Next.js App Router 16**, **React 19**, **TypeScript**, **MUI 9** (Data Grid + Date Pickers), React Hook Form, Zod, Zustand.

Vendor dan IT internal **wajib** clone repo ini, bukan membuat UI dari nol dan bukan memakai Tailwind / Ant Design / Chakra / Bootstrap.

## Menjalankan di lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`. Dengan `NEXT_PUBLIC_ALLOW_LOCAL_DEV_WITHOUT_AUTH=true` dashboard bisa dibuka tanpa token IAM.

Halaman contoh siap pakai: `/example` (table, filter, dialog, export).

## Struktur folder

```text
src/
├── app/                 # routing Next.js saja (layout, page, loading, error)
├── components/
│   ├── base/            # komponen wajib: table, form, dialog, chip, export
│   ├── form/            # wrapper React Hook Form
│   ├── layout/          # header, sidebar, shell, toolbar
│   └── feedback/        # loader, empty, error
├── core/
│   ├── auth/            # bootstrap IAM, session, logout
│   ├── config/          # app, env, menu, route
│   ├── constants/       # storage key, page size
│   ├── helpers/         # permission & role (ID dari env/DB, bukan hardcoded)
│   ├── http/            # apiClient
│   ├── iam/             # verify-user, menu, app-roles, menus-mapping
│   ├── layout/          # PageTitle / PageToolbar data
│   ├── services/        # service lintas modul (notifikasi)
│   ├── types/
│   └── utils/           # tanggal, download, storage
├── design-system/       # theme, token warna Hino, typography Poppins
├── modules/             # modul bisnis project (contoh: example)
└── store/               # Zustand UI state (sidebar, theme)
deploy/                  # PM2 + Nginx production
```

## Komponen yang wajib dipakai

| Kebutuhan | Komponen |
|---|---|
| Table list (server pagination) | `AppDataGrid` |
| Table sederhana | `AppTable` |
| Dialog form | `AppDialog` + `AppDialogTextField` + `AppDialogActions` |
| Konfirmasi hapus | `AppConfirmDialog` |
| Konfirmasi + summary + notes | `AppActionConfirmDialog` |
| Filter tanggal | `AppDatePicker` (`DD-MM-YYYY`) |
| Export Excel/PDF | `ExportDataButton` |
| Status | `AppStatusChip` |
| Loading splash | `AppLoading` |
| Form terstruktur | `RHFTextField`, `RHFSelect`, `RHFDatePicker` |

Jangan memakai `DataGrid` / `Dialog` MUI mentah di halaman bisnis. Wrap sudah distandarkan (sticky action, zebra, footer, tinggi input dialog).

Pola list page: lihat `src/modules/example/components/ExampleListPage.tsx`.

- Search debounce 300ms, **minimal 3 karakter**
- Date range `date_from` / `date_to` format `YYYY-MM-DD`
- Pagination server: `page` 1-based, `page_size` 20/50/100, `sort_by`, `sort_order`
- Kolom aksi `field: '__actions__'` agar **sticky di kiri**

## Cara menambah modul

1. Buat `src/modules/{modul}/` (components, services, types).
2. Buat route `src/app/{modul}/page.tsx` + `layout.tsx` yang membungkus `DashboardShell`.
3. Daftarkan menu di `src/core/config/menu.config.ts` (slug permission).
4. Ganti `USE_MOCK` di service menjadi pemanggilan `apiClient`.

## Branding

Warna primer `#E30613`, sekunder `#005BAC`. Logo: `public/media/logos/logo-hino-v.png`. Ubah lewat `.env.local` / `app.config.ts`.

## Auth IAM — Tanpa Halaman Login

HIS (Hino Integrated System) adalah portal IAM HMSI. **Aplikasi modul tidak memiliki halaman Login.**

Alur:

1. User login di portal HIS (master app).
2. User klik kotak **Launcher** aplikasi modul.
3. IAM mengarahkan ke URL aplikasi dengan `?auth={"access_token":"..."}` jika login sukses.
4. Token disimpan → `POST {IAM}/v1/verify-user` → `GET {API}/auth/session`.
5. Tanpa akses → `NoAccessDialog` → kembali ke master app.

**Wajib:** set `NEXT_PUBLIC_LAUNCHER_ID` di `.env` — ID launcher IAM untuk aplikasi ini.

Menu sidebar **dinamis** dari API IAM sesuai launcher. Ikon menu memakai **MUI Icons**.

ID role group-admin **tidak di-hardcode** di komponen. Pakai `NEXT_PUBLIC_GROUP_ADMIN_ROLE_ID`. Prefix permission pakai `NEXT_PUBLIC_APP_PERMISSION_PREFIXES`.

Production: set `NEXT_PUBLIC_ALLOW_LOCAL_DEV_WITHOUT_AUTH=false`.

## Aturan UI/UX Layout HIS

| Area | Aturan |
|---|---|
| **Sidebar** | Logo Hino background merah di atas; ikon collapse/uncollapse di sampingnya; menu dinamis dari IAM; ikon MUI |
| **Header kanan atas** | Lonceng notifikasi; ikon Hino → klik tampilkan nama & posisi user |
| **Toolbar tabel** | Refresh → Search → custom filter (tanggal, dll.) → Export Data (kanan) |
| **Tabel** | `AppDataGrid`; kolom **Action sticky kiri** dengan ikon MUI; pagination kanan bawah |
| **Form** | `AppDialog` + komponen form standar; semua basis MUI |

Lihat modul contoh `/example` dan `ExampleListPage.tsx`.

## Deploy production (PM2 + Nginx)

Arsitektur:

```text
Browser → GCP Load Balancer (HTTPS) → Nginx :80 → PM2 Next.js 127.0.0.1:8093
```

Di server (Node.js 20+):

```bash
cd /var/www/his-standard-uiux
cp deploy/.env.production.example .env
# isi URL API, IAM, launcher
chmod +x deploy/*.sh
bash deploy/deploy-prod.sh --all
```

- PM2 config: `deploy/ecosystem.prod.config.js`
- Nginx: `deploy/nginx-prod.conf.example` (ganti `server_name`)
- Update: `git pull && bash deploy/deploy-prod.sh`

SSL di-terminate di load balancer. PM2 hanya listen internal.

## Larangan

- Tailwind, Bootstrap, Ant Design, Chakra, CSS framework lain
- Hardcode warna di halaman (gunakan theme token)
- Bypass `AppDataGrid` / `AppDialog` untuk list/form utama
- Commit file `.env` / secret
