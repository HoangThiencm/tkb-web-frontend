# TKB Web Frontend - Next.js

Frontend application cho hệ thống quản lý thời khóa biểu, được deploy trên Vercel.

## Cấu trúc

```
web-frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   ├── dashboard/
│   ├── timetable/
│   ├── data-management/
│   └── api/                # API routes (if needed)
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── timetable/          # Timetable-specific components
│   └── forms/              # Form components
├── lib/                    # Utilities
│   ├── api.ts              # API client
│   └── utils.ts
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── public/                 # Static assets
└── package.json
```

## Setup

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình environment variables:
```bash
cp .env.example .env.local
# Edit .env.local với API URL của bạn
```

3. Chạy development server:
```bash
npm run dev
```

## Deploy lên Vercel

1. Push code lên GitHub repository
2. Kết nối repository với Vercel
3. Cấu hình environment variables trong Vercel dashboard
4. Deploy tự động

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query (for data fetching)
- Zustand (for state management)
- shadcn/ui (UI components)

