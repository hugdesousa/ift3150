/* =========================================================================
   lib/utils/filters.ts — type & valeurs par défaut des filtres
   ========================================================================= */
export interface Filters {
  minPrice: number;
  maxPrice: number;
  rating: number;
  useLocation: boolean;
  radius: number;
}

export const defaultFilters: Filters = {
  minPrice: 0,
  maxPrice: 1000,
  rating: 0,
  useLocation: false,
  radius: 25,
};
