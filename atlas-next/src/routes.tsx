import { lazy, type ComponentType } from 'react';

/**
 * Route configuration interface.
 * Each route maps a URL path to a lazily-loaded page component.
 */
export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType>;
  title: string;
  icon: string;
  isSecured: boolean;
  hidden?: boolean;
}

/**
 * All 17 page routes for the OHDSI Atlas application.
 * Uses React.lazy for code-splitting via dynamic imports.
 * 404 fallback redirects to Vocabulary (see router setup in App.tsx).
 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    element: lazy<ComponentType>(() => import('@/pages/Home')),
    title: 'Home',
    icon: 'home',
    isSecured: false,
  },
  {
    path: '/vocabulary',
    element: lazy<ComponentType>(() => import('@/pages/Vocabulary')),
    title: 'Vocabulary',
    icon: 'book',
    isSecured: false,
  },
  {
    path: '/cohortdefinitions',
    element: lazy<ComponentType>(() => import('@/pages/CohortDefinitions')),
    title: 'Cohort Definitions',
    icon: 'users',
    isSecured: true,
  },
  {
    path: '/conceptsets',
    element: lazy<ComponentType>(() => import('@/pages/ConceptSets')),
    title: 'Concept Sets',
    icon: 'shopping-cart',
    isSecured: true,
  },
  {
    path: '/characterizations',
    element: lazy<ComponentType>(() => import('@/pages/Characterizations')),
    title: 'Characterizations',
    icon: 'bar-chart',
    isSecured: true,
  },
  {
    path: '/incidencerates',
    element: lazy<ComponentType>(() => import('@/pages/IncidenceRates')),
    title: 'Incidence Rates',
    icon: 'signal',
    isSecured: true,
  },
  {
    path: '/pathways',
    element: lazy<ComponentType>(() => import('@/pages/Pathways')),
    title: 'Pathways',
    icon: 'random',
    isSecured: true,
  },
  {
    path: '/estimation',
    element: lazy<ComponentType>(() => import('@/pages/Estimation')),
    title: 'Estimation',
    icon: 'flash',
    isSecured: true,
  },
  {
    path: '/prediction',
    element: lazy<ComponentType>(() => import('@/pages/Prediction')),
    title: 'Prediction',
    icon: 'eye-open',
    isSecured: true,
  },
  {
    path: '/profiles',
    element: lazy<ComponentType>(() => import('@/pages/Profiles')),
    title: 'Profiles',
    icon: 'user',
    isSecured: true,
  },
  {
    path: '/jobs',
    element: lazy<ComponentType>(() => import('@/pages/Jobs')),
    title: 'Jobs',
    icon: 'tasks',
    isSecured: true,
  },
  {
    path: '/configuration',
    element: lazy<ComponentType>(() => import('@/pages/Configuration')),
    title: 'Configuration',
    icon: 'wrench',
    isSecured: true,
  },
  {
    path: '/datasources',
    element: lazy<ComponentType>(() => import('@/pages/DataSources')),
    title: 'Data Sources',
    icon: 'hdd',
    isSecured: false,
  },
  {
    path: '/feedback',
    element: lazy<ComponentType>(() => import('@/pages/Feedback')),
    title: 'Feedback',
    icon: 'comment',
    isSecured: false,
    hidden: true,
  },
  {
    path: '/tools',
    element: lazy<ComponentType>(() => import('@/pages/Tools')),
    title: 'Tools',
    icon: 'cog',
    isSecured: true,
    hidden: true,
  },
  {
    path: '/reusables',
    element: lazy<ComponentType>(() => import('@/pages/Reusables')),
    title: 'Reusables',
    icon: 'retweet',
    isSecured: true,
  },
  {
    path: '/tagging',
    element: lazy<ComponentType>(() => import('@/pages/Tagging')),
    title: 'Tagging',
    icon: 'tags',
    isSecured: true,
  },
];

/**
 * Look up a route config by its path.
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return routes.find((r) => r.path === path);
}

/**
 * The default redirect target for unknown URLs (404).
 */
export const FALLBACK_PATH = '/vocabulary';
