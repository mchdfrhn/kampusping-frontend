# Modules

One folder per feature. `example/` is the reference implementation to copy.

```text
<module>/
├── types.ts                   # API shapes and filters
├── services/<module>.service.ts   # thin wrappers over apiClient
└── components/
    ├── <Module>ListPage.tsx   # list page built on useServerGrid + AppDataGrid
    └── <Module>FormDialog.tsx # React Hook Form + Zod, errors mapped with handleFormApiError
```

Wire it up in three places: a route under `src/app/(app)/`, a menu entry in
`src/core/config/menu.config.ts`, and the permission codes in `src/core/auth/permissions.ts`.
