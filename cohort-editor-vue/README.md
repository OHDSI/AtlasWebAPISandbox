# Cohort Editor Vue.js

A simplified, Vue.js-native cohort editor demonstrating reactive JSON document manipulation without external mapping dependencies.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` with hot module reloading (HMR).

### Build

```bash
npm run build
```

Produces optimized production build in `dist/` directory.

### Type Checking

```bash
npm run type-check
```

Validates TypeScript without emitting files.

## Project Structure

```
src/
├── components/       # Vue components (shared, criteria, editor sections)
├── composables/      # Custom Vue composables (useCohortEditor, etc.)
├── stores/           # Pinia state management
├── services/         # Mock API services and business logic
├── types/            # TypeScript type definitions (cohort expression model)
├── views/            # Page-level components
├── router/           # Vue Router configuration
├── utils/            # Utility functions and type guards
├── assets/           # Static assets
├── locales/          # i18n translations (future)
└── data/             # Sample/mock data files
```

## Development Phases

### Phase 1: Development Environment (✅ Complete)
- Project structure and tooling setup
- Vite + TypeScript + Vuetify configured
- Router and Pinia store initialized
- Ready for Phase 2 implementation

### Phase 2: Type System & Composables (In Progress)
- TypeScript types for cohort expression
- Domain-specific composables
- Mock service layer
- Pinia store implementation

### Phase 3: Editor UI & Integration (Pending)
- Interactive editor components
- Import/export JSON functionality
- Complete workflow demonstration

## TypeScript Configuration

Strict mode enabled for maximum type safety, matching Atlas3 standards:
- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `noUnusedLocals`
- `noUnusedParameters`
- `noImplicitReturns`

## Technology Stack

- **Vue 3.5** – Progressive JavaScript framework
- **Vuetify 3.5** – Material Design component library
- **Pinia 2.1** – State management
- **Vue Router 4.2** – Client-side routing
- **TypeScript 5.9** – Type-safe JavaScript
- **Vite 7.3** – Build tool and dev server
- **Zod 3.22** – Runtime type validation

## Notes

- All API interactions are mocked (localStorage-based for demo)
- No WebAPI backend dependency
- Focus on demonstrating Vue 3 reactivity and composable patterns
