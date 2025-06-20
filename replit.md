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
- June 19, 2025. Complete migration from Supabase to JWT authentication
  * Implemented Express JWT authentication with bcryptjs password hashing
  * Created JWT middleware for protecting API routes
  * Built new login/signup forms using React Hook Form
  * Added HTTP-only cookie support with localStorage backup
  * Protected all API endpoints with JWT authentication middleware
  * Replaced Supabase AuthProvider with custom JWT authentication context
- June 19, 2025. Complete Supabase production data migration
  * Successfully imported all 12 CSV files from Supabase export
  * Migrated 2 accounts, 48 categories, 3 clients, 3 employees
  * Added user management tables: user_profiles, permissions, role_permissions
  * Imported financial data: 5 income records, 5 subscriptions, 10 spending records
  * Created payment_sources and user_invitations tables
  * Total records migrated: 97 production records across 12 tables
- June 19, 2025. Rebranded application to "FIN" with modern authentication UI
  * Changed application name from "Finance Compass" to "FIN"
  * Created modern gradient logo with F letter and $ symbol
  * Redesigned login page at /auth/login with glassmorphism styling
  * Redesigned signup page at /auth/signup with modern form design
  * Updated root route (/) to redirect based on authentication status
  * Authenticated users redirect to /dashboard, unauthenticated to /auth/login
  * Applied gradient backgrounds, rounded corners, and smooth animations
  * Enhanced form styling with focus states and hover effects
- June 19, 2025. Complete authentication UI redesign with split-screen layout
  * Implemented beautiful split-screen design inspired by modern SaaS applications
  * Left panel features purple gradient background with 3D illustration mockups
  * Right panel contains clean, minimal forms with consistent styling
  * Updated form controls with proper spacing, typography, and indigo color scheme
  * Added mobile-responsive design with logo fallbacks for smaller screens
  * Enhanced user experience with professional authentication flow
- June 20, 2025. Original frontend layout restoration from ZIP file
  * Extracted and restored user's actual dashboard components from ZIP archive
  * Replaced generated components with original OverviewTab, FinanceTab layouts
  * Restored comprehensive filtering system (client, employee, category, date range)
  * Implemented TimeRangePicker with day/week/month/quarter/year options
  * Connected original Revenue vs Expenses charts to new backend API
  * Restored Income, Expenses, Subscriptions tabs with full CRUD functionality
  * Maintained purple gradient sidebar and original responsive design
  * Successfully integrated original frontend with new enterprise authentication
- June 20, 2025. Enhanced employee management system with CSV import
  * Extended employee schema with birth_date, seniority_level, payment_amount, direct_manager_id, group_name
  * Built robust CSV import parser with real-world data sanitization
  * Added currency parsing for PKR, USD, commas, percentages (e.g., "PKR 150,000")
  * Implemented flexible date format parsing (YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY)
  * Created field mapping system for various CSV header variations
  * Added comprehensive validation with detailed error reporting
  * Enhanced employee forms with all new fields and improved UI
  * Updated employee table with seniority badges, formatted payment amounts
  * Implemented organization-based security for data isolation
- June 20, 2025. Successfully completed CSV import functionality with full data preview
  * Fixed CSV field mapping to handle exact user headers (Worker Full Name, Personal Email, etc.)
  * Implemented proper data preview showing actual parsed employee data instead of placeholders
  * Enhanced UI with larger dialog, horizontal scrolling, and accessibility improvements
  * Successfully imported all 33 employees from production CSV file
  * Added manager relationship resolution with proper error handling for missing managers
  * Completed comprehensive testing with real user data validation
- June 20, 2025. Enhanced income CSV import with robust field handling and boolean parsing
  * Fixed recurring flag logic with case-insensitive boolean parsing (TRUE/true/Yes/1/on)
  * Added recurring_end_date column display in CSV import preview table
  * Enhanced preview table to show optional columns (invoice_id, client_id, payment_source_id)
  * Implemented proper handling of empty optional fields as null values
  * Updated frontend to display recurring status as "Yes"/"No" for better readability
  * Applied consistent Card-based UI layout across Income, Expenses, and Employees pages
- June 20, 2025. Completed comprehensive subscriptions management system
  * Built full CRUD operations for both internal and client-billed recurring expenses
  * Enhanced subscriptions schema with type differentiation, client assignments, and billing cycles
  * Added comprehensive API endpoints with data enrichment (client, employee, category names)
  * Created modern subscription management UI with stats cards, filtering, and form validation
  * Implemented subscription types: "internal" for company expenses, "client" for billable services
  * Added billing cycle options: monthly, quarterly, bi-annual, yearly with visual badges
  * Integrated client assignment for client-billed subscriptions with revenue tracking
  * Built reconciliation status tracking and comprehensive subscription analytics
- June 20, 2025. Built complete enterprise-grade user management system at /settings/user-management
  * Enhanced users table with role, department, phoneNumber, status, lastLoginAt fields
  * Created comprehensive userInvitations table with token-based invitation workflow
  * Implemented team management with role-based permissions (admin, manager, editor, viewer)
  * Built invitation system with email-based invites, token generation, and expiry tracking
  * Added comprehensive user management API with CRUD operations, role updates, status management
  * Created modern user management UI with team member listing, invitation management, and stats dashboard
  * Implemented user status management (active, inactive, suspended) with visual indicators
  * Added invitation workflow with pending, accepted, expired, cancelled states and resend functionality
- June 20, 2025. Completed SendGrid SMTP integration with full email delivery system
  * Integrated SendGrid API with professional HTML email templates for invitations
  * Built comprehensive email service with role-specific messaging and branding
  * Added real email delivery for both new invitations and resend functionality
  * Created complete accept invitation workflow with /accept-invitation/:token route
  * Built AcceptInvitation React component with form validation and account creation
  * Integrated owner (jay@dartnox.com) into Team Members with super_admin role and self-editing restrictions
  * Fixed invitation URLs to use actual app domain instead of placeholder
  * Resolved frontend data structure issues with invitation verification
  * Completed end-to-end testing with real email delivery and account creation workflow
  * Fixed JavaScript errors in invitation acceptance page with proper null checks
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```