# Technical Context

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.19 | Build tool and dev server |
| TypeScript | 5.8.3 | Type safety |
| React Router DOM | 6.30.1 | Client-side routing |
| TanStack Query | 5.95.0 | Server state management |
| tRPC React Query | 11.14.1 | End-to-end type-safe API |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| shadcn/ui (Radix) | Various | UI component primitives |
| React Hook Form | 7.61.1 | Form management |
| Zod | 3.25.76 | Schema validation |
| Framer Motion | 12.38.0 | Animations |
| Lucide React | 0.462.0 | Icon library |
| date-fns | 3.6.0 | Date manipulation |
| Recharts | 2.15.4 | Charts and visualizations |
| Sonner | 1.7.4 | Toast notifications |
| next-themes | 0.3.0 | Theme management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5.2.1 | Web server |
| tRPC Server | 11.14.1 | Type-safe API framework |
| Supabase JS | 2.99.3 | Database client & auth |
| SuperJSON | 2.2.6 | JSON serialization |
| CORS | 2.8.6 | Cross-origin support |
| tsx | 4.21.0 | TypeScript execution |

### Database & Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database, Authentication, Storage |
| Stripe | Payment processing (planned) |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | 9.32.0 | Code linting |
| TypeScript ESLint | 8.38.0 | TypeScript linting |
| Vitest | 3.2.4 | Unit testing |
| Playwright | 1.57.0 | E2E testing |
| Testing Library | 16.0.0 | React testing utilities |

## Key Dependencies Details

### UI Component Library (shadcn/ui)
Built on Radix UI primitives:
- `@radix-ui/react-accordion` through `@radix-ui/react-tooltip`
- Provides accessible, unstyled components
- Customized with Tailwind CSS
- Includes: dialogs, dropdowns, forms, navigation, etc.

### Form Handling Stack
```
React Hook Form ←→ Zod Resolver ←→ Zod Schemas
```
- Declarative form validation
- Type inference from schemas
- Shared validators between frontend and backend

### tRPC Configuration
- Uses SuperJSON for serialization (Date, Map, Set support)
- React Query integration for caching and invalidation
- Express adapter for HTTP transport

## Development Scripts

```bash
# Development
npm run dev           # Start Vite dev server
npm run dev:server    # Start Express server with watch
npm run dev:all       # Run both concurrently

# Build
npm run build         # Production build
npm run build:dev     # Development build

# Testing
npm run test          # Run tests once
npm run test:watch    # Watch mode

# Other
npm run lint          # ESLint check
npm run preview       # Preview production build
npm run server        # Run server without watch
```

## Build Configuration

### Vite Configuration
- React SWC plugin for fast refresh
- Path aliases for clean imports
- TypeScript/JSX transformations

### TypeScript Configuration
- Separate configs for app, node, and base
- Strict type checking enabled
- Modern ES target

### Tailwind Configuration
- Typography plugin (@tailwindcss/typography)
- Custom animations (tailwindcss-animate)
- shadcn/ui compatible setup

## Environment Variables
Required environment variables (see `.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- Database connection strings (if applicable)
- Stripe keys (for payments)

## Browser Support
- Modern browsers (ES2020+)
- Mobile-responsive design
- Touch-friendly interactions

## Performance Considerations
- Vite for fast HMR and builds
- SWC for fast TypeScript compilation
- React Query for efficient caching
- Lazy loading of routes (potential)
- Image optimization (potential)