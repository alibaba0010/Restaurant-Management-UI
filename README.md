# Restaurant Management - Frontend

A modern, high-performance web application for managing restaurants and menus, built with Next.js 15 and specialized for low-latency media handling.

## 🚀 Features

- **Next.js 15 App Router**: Leveraging the latest React features and server-side optimizations.
- **Optimized Media Uploads**: Implements AWS S3 Presigned URLs for direct client-to-cloud uploads, bypassing the backend to minimize latency (reducing upload jumps from 2 to 1). Support for Multipart uploads.
- **Cursor-Based Pagination**: Efficient, scalable list navigation for restaurants and menus, replacing traditional offset pagination.
- **Global State Management**: Powered by `Zustand` for seamless authentication and UI state control.
- **Enhanced Authentication**: Robust flows for Google Sign-in, Password Reset, and Email Verification.
- **Premium Design System**: Built with `Tailwind CSS`, `Radix UI`, and `Lucide React` for a sleek, responsive, and accessible interface.
- **Advanced Form Handling**: Integrated `React Hook Form` with `Zod` for robust client-side validation.
- **Dashboard & Analytics**: Real-time management of restaurants, menu items, and media assets.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (Turbopack enabled)
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **State**: Zustand
- **Icons**: Lucide React
- **Validation**: Zod
- **API Communication**: Fetch with custom interceptors for token refresh and error handling.

## 📋 Prerequisites

- Node.js 20 or higher
- [Backend API](https://github.com/alibaba0010/postgres-api) running locally or remotely.

## ⚙️ Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

## 🏃‍♂️ Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8000`.

## 📁 Project Structure

```
├── src/
│   ├── app/            # Next.js App Router (Pages & Layouts)
│   ├── components/     # Reusable UI components (shadcn/ui base)
│   ├── hooks/          # Custom React hooks (toast, etc.)
│   ├── lib/            # Utilities, API client, and Zustand stores
│   │   ├── api.ts      # Optimized API client with S3 presigned logic
│   │   ├── store.ts    # Global state management
│   │   └── types.ts    # TypeScript definitions
│   └── styles/         # Global styles and Tailwind configuration
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
