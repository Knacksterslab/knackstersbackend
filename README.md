# Knacksters - 360° On-Demand Cloud Workforce

A modern, full-stack platform connecting businesses with pre-vetted professionals across AI, cybersecurity, development, design, marketing, and healthcare. Built with Next.js, Express, and SuperTokens.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend** - Next.js 14 application with React, TypeScript, and Tailwind CSS
- **Backend** - Express API server with SuperTokens authentication

```
/Knacksters
  /frontend      - Next.js app (port 3000)
  /backend       - Express API (port 5000)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation & Running

You need to run both frontend and backend servers:

#### Terminal 1 - Backend Server

```bash
cd backend
npm install
npm run dev
```

Backend will start on **http://localhost:5000**

#### Terminal 2 - Frontend Application

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on **http://localhost:3000**

### Environment Variables

**See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete setup instructions.**

#### Quick Start - Minimum Required

**Backend** (`backend/.env`):
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/knacksters"
SUPERTOKENS_CONNECTION_URI=https://try.supertokens.com
SUPERTOKENS_API_KEY=your_key
STRIPE_SECRET_KEY=sk_test_your_key
ADMIN_PASSWORD=your_password
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CAL_CLIENT_URL=https://cal.com/yourusername/client-onboarding
NEXT_PUBLIC_CAL_TALENT_URL=https://cal.com/yourusername/talent-interview
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

## 📚 Features

### Authentication & Authorization

- **SuperTokens Integration** - Email/password authentication
- **Role-Based Access Control** - Admin, Manager, Talent, Client roles
- **Protected Routes** - AuthGuard component for route protection
- **Session Management** - Secure session handling with cookies

### User Roles

- **Admin** - Full system access, content management
- **Manager** - Team and assignment management
- **Talent** - Profile, tasks, and earnings management
- **Client** - Dashboard and billing access

### Scheduling & Onboarding

- **Cal.com Integration** - Free hosted scheduling solution
- **Client Onboarding** - Automated call booking for new clients
- **Talent Interviews** - Streamlined interview scheduling
- See [CAL_COM_SETUP.md](./CAL_COM_SETUP.md) for setup instructions

### Admin Features

- Content management for landing page
- Partner management with file uploads
- User management

### Billing & Payments

- **Stripe Integration** - Subscription management
- **Flexible Plans** - Starter, Growth, Enterprise tiers
- **Extra Hours** - Purchase additional hours as needed
- **Invoice Management** - Automated billing and receipts

## 🛠️ Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **SuperTokens Auth React** - Authentication UI

### Backend

- **Express.js** - Web framework
- **SuperTokens Node** - Authentication backend
- **TypeScript** - Type safety
- **Multer** - File upload handling

## 📖 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend API Documentation](./backend/README.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Cal.com Scheduling Setup](./CAL_COM_SETUP.md)

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Input validation
- File upload restrictions
- Session-based authentication

## 🧪 Development

### Building for Production

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
npm start
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend  
cd frontend
npm run lint
```

## 📝 License

MIT

## 👥 Contributors

Knacksters Team
