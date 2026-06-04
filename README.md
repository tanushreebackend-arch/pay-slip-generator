This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# PayGen — Payslip & Letter Generator

A modern, full-stack HR document generation tool built for internal admin use.
Generate professional payslips and employment letters in seconds.

---

## What This App Does

PayGen is an internal admin tool that allows HR/admin teams to:

- Manage employee records (add manually or bulk upload via Excel)
- Generate payslips with automatic salary breakdowns
- Generate Relieving Letters and Experience/Internship Letters
- Store company settings (logo, signature, contact info) once — reused everywhere
- Download/print all documents as PDF via browser print

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/Database:** Supabase (PostgreSQL + Storage)
- **PDF Generation:** Browser window.print() with print CSS
- **Excel Parsing:** xlsx library
- **Icons:** lucide-react
- **Notifications:** react-hot-toast

---

## Features

### Employee Management
- Add employees manually with full details
- Bulk import via Excel upload (.xlsx / .xls)
- Edit and delete employee records

### Payslip Generator
- Search employee — all details auto-fill
- Pro-rata salary calculation based on From Date / To Date
- Auto salary breakdown:
  - Basic = 50% of Gross
  - HRA = 40% of Basic
  - Special Allowance = Remaining
  - PF = 12% of Basic (auto-calculated)
  - Custom deductions (admin can add any)
- LOP days support
- Amount in words (Indian format)
- 3 templates: Corporate Standard, Minimal Elegant, Modern Corporate
- Optional Tax Summary Page (Page 2)
- Download as PDF

### Letter Generator
- Relieving Letter + Experience/Internship Letter
- Employee details auto-fill
- Company letterhead auto-loaded
- Download as PDF

### Settings
- Company name, address, email, phone, website
- Signatory name and designation
- Logo and signature upload
- Stored once — used on all documents

---

## Salary Calculation

Gross Salary (per employee)
  Basic = Gross x 50%
  HRA = Basic x 40%
  Special Allowance = Gross - Basic - HRA

Pro-rata ratio = (Days in range - LOP) / Total calendar days in month
Actual Earnings = Standard x Pro-rata ratio
PF = Actual Basic x 12%
Net Pay = Actual Gross - PF - Custom Deductions

---

## Project Structure

/app
  /employees     → Employee management
  /payslip       → Payslip generator
  /letters       → Letter generator
  /settings      → Company settings

/components
  PayslipPreview.tsx      → Template 1: Corporate Standard
  PayslipPreviewT2.tsx    → Template 2: Minimal Elegant
  PayslipPreviewT3.tsx    → Template 3: Modern Corporate
  LetterPreview.tsx       → Letters

/lib
  supabase.ts         → Supabase client
  salaryCalc.ts       → Salary logic
  numberToWords.ts    → Indian number to words
  utils.ts            → Helpers

/context
  SettingsContext.tsx → Global settings

/supabase
  schema.sql          → Run this in Supabase SQL editor

---

## Supabase Setup

1. Create project at supabase.com
2. Run /supabase/schema.sql in SQL Editor
3. Create public storage bucket named company-assets
4. Copy Project URL and anon key

---

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

---

## Getting Started

npm install
npm run dev

Open http://localhost:3000

---

## Deployment

Push to GitHub → Import on vercel.com → Add env variables → Deploy

---

## Workflow

1. Settings → Add logo, signature, company info
2. Employees → Add manually or upload Excel
3. Payslip → Select template, search employee, generate, download PDF
4. Letters → Select type, search employee, generate, download PDF

---

## Notes

- No authentication — internal admin use only
- All documents marked as system-generated
- PDF via browser print (Ctrl+P → Save as PDF)
- Decimal values always shown (e.g. 10,368.91)

---

Built by Purple Merit Technologies
