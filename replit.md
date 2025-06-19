# Finance Logger Application

## Overview

This is a full-stack finance management application built with React, Node.js, Express, and PostgreSQL. The application provides a comprehensive business finance tracking system with support for managing accounts, categories, clients, developers, and employees. It features a modern UI built with shadcn/ui components and uses Drizzle ORM for database interactions.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite for development and production builds
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with RESTful API design
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Build Tool**: esbuild for production bundling
- **Development**: tsx for TypeScript execution

### Database Schema
The application manages five main entities:
- **Accounts**: Company accounts with currency support
- **Categories**: Hierarchical expense/income categories
- **Clients**: Customer management with archival support
- **Developers**: Hourly rate tracking linked to clients
- **Employees**: HR management with manager relationships

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with schema validation using drizzle-zod
- **Database**: PostgreSQL via Neon serverless platform
- **Migrations**: Managed through drizzle-kit
- **Schema**: Centralized in `shared/schema.ts` for type safety across frontend and backend

### API Layer
- **REST Endpoints**: Full CRUD operations for all entities
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Storage Layer**: Abstracted database operations through storage interface

### Frontend Components
- **Layout**: Sidebar navigation with responsive design
- **Pages**: Dedicated views for each entity type
- **Modals**: Unified add/edit record functionality
- **UI Components**: Comprehensive shadcn/ui component library
- **Data Fetching**: TanStack Query with optimistic updates

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Processing**: Express routes validate requests and call storage methods
3. **Database Operations**: Drizzle ORM executes SQL queries against PostgreSQL
4. **Response Handling**: Results flow back through the same chain with type safety
5. **UI Updates**: TanStack Query manages cache invalidation and UI synchronization

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React with comprehensive Radix UI component suite
- **Form Management**: React Hook Form with Hookform resolvers
- **Data Fetching**: TanStack React Query for server state management
- **Validation**: Zod for runtime type checking and validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL with connection pooling
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Server**: Express.js with standard middleware stack
- **Development**: tsx for TypeScript execution and hot reloading

### Build and Development
- **Build System**: Vite for frontend, esbuild for backend
- **TypeScript**: Shared configuration across frontend and backend
- **Development Server**: Integrated setup with HMR support
- **Replit Integration**: Optimized for Replit development environment

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL
- **Hot Reloading**: Vite middleware integrated with Express
- **Port Configuration**: Frontend serves on port 5000 with API routes
- **Database**: Automatic Neon database provisioning

### Production Build
- **Frontend**: Static build output to `dist/public`
- **Backend**: Bundled Node.js application in `dist`
- **Deployment**: Replit autoscale deployment target
- **Environment**: Production mode with optimized builds

### Database Management
- **Migrations**: Drizzle-kit for schema management
- **Connection**: Neon serverless with WebSocket support
- **Environment Variables**: DATABASE_URL for connection configuration

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```