# Cohort Editor Feature

This directory contains all code for the cohort editor feature. Files are organized by type but colocated in one folder for cohesion and discoverability.

## Current Structure

Start with minimal files and expand as needs become clear:

```
cohort-editor/
  cohortDefinition.ts                 # Type definitions
```

## File Types

### Components (`*.vue`)
- **Example:** `CriteriaRenderer.vue`
- **Purpose:** Presentation layer. Renders UI, accepts props, emits events.
- **When to add:** As you need new UI sections or sub-components

### Types (`*.types.ts` or `*Definition.ts`)
- **Example:** `cohortDefinition.ts`
- **Purpose:** TypeScript interfaces and type definitions
- **Content:** Plain objects/interfaces reflecting the domain model
- **When to add:** When defining a new data structure or domain concept

### Composables (`use*.ts`)
- **Example:** `useCohortEditor.ts` (add when needed)
- **Purpose:** Reusable reactive behavior (state, watchers, event handling)
- **When to add:** When you identify business logic that needs reactive behavior

### Services (`*Service.ts`)
- **Example:** `cohortExpressionService.ts` (add when needed)
- **Purpose:** API coordination, business operations, data transformations
- **When to add:** When you need to separate business logic from components/composables

### Stores (`*Store.ts`)
- **Example:** `cohortStore.ts` (add when needed)
- **Purpose:** Pinia global state management
- **When to add:** When you need centralized state across multiple components

### Utilities (`*Utils.ts`)
- **Example:** `cohortExpressionUtils.ts` (add when needed)
- **Purpose:** Pure functions, helpers, type guards
- **When to add:** When you have reusable logic used by multiple files

## Design Principles

### 1. **Start Small, Expand as Needed**
Begin with minimal files. Add new files only when you identify a specific need:
- "I need a composable to manage state" → Add `use*.ts`
- "I need a service to coordinate API calls" → Add `*Service.ts`
- "I need type definitions for a new domain concept" → Add `*.types.ts`

### 2. **Colocated Features**
All cohort editor code lives in one folder. A developer working on this feature stays in one place.

### 3. **Flat Structure = Easy Navigation**
With 5-10 files max, you can quickly scan and find what you need. No deep folder traversal.

### 4. **Naming Conventions = Type Discovery**
File extension/prefix tells you what kind of code it contains:
- `.vue` → Component
- `use*` → Composable
- `*Service.ts` → Service
- `*Utils.ts` → Utilities
- `*Store.ts` → Pinia store
- `*.types.ts` / `*Definition.ts` → Types

### 5. **Scalability**
When adding new features (concept-sets, criteria, reports), create sibling folders at `src/`:
```
src/
  cohort-editor/     # This folder (start simple, expand as needed)
  concept-sets/      # Future: sibling feature (same flat structure)
  criteria-builder/  # Future: sibling feature (same flat structure)
```

## Implementation Status

### Phase 1 ✅ Complete
- ✅ Minimal project structure established
- ✅ Type definitions file ready
- ✅ Dev environment configured

### Phase 2 (Starting)
- [ ] Implement type hierarchy in cohortDefinition.ts (from circe-be)
- [ ] Add composables as needed (start with main orchestrator when ready)
- [ ] Add services as needed (when business logic complexity emerges)
- [ ] Build out components iteratively

### Phase 3 (Future)
- [ ] Import/export JSON functionality
- [ ] Full editor UI
- [ ] Integration testing

## Next Steps

1. **Define the type hierarchy** in `cohortDefinition.ts` based on circe-be Java classes
2. **Extract a dedicated cohort-expression editor** from the current `CohortBuilder` content
3. **Add composables incrementally** when state management needs emerge
4. **Add services incrementally** when API/business logic complexity emerges

Keep it simple. Add complexity only when needed.


