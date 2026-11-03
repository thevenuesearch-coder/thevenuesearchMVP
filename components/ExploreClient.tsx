'use client';

/*
 * The Explore page UI now lives in ./explore/ExploreView (icon rail,
 * filter panel, results toolbar and cards). This file keeps the
 * original import path used by app/explore/page.tsx.
 */
export { ExploreView as ExploreClient } from './explore/ExploreView';
export type { ExploreViewProps as ExploreClientProps } from './explore/ExploreView';
