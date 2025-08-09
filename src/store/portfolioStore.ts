import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import sift from 'sift';
import { Project } from '../lib/firestore';

interface FilterState {
  activeCategory: string;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface PortfolioStore {
  // State
  projects: Project[];
  filteredProjects: Project[];
  categories: Array<{ name: string; count: number }>;
  isLoading: boolean;
  error: string | null;
  filter: FilterState;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  filterProjects: () => void;
  resetFilter: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed getters
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectsByCategory: (category: string) => Project[];
  getRelatedProjects: (project: Project, limit?: number) => Project[];
}

const initialFilterState: FilterState = {
  activeCategory: 'ทั้งหมด',
  searchQuery: '',
  sortBy: 'newest',
  sortOrder: 'desc',
};

export const usePortfolioStore = create<PortfolioStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      filteredProjects: [],
      categories: [{ name: 'ทั้งหมด', count: 0 }],
      isLoading: false,
      error: null,
      filter: initialFilterState,

      // Actions
      setProjects: (projects: Project[]) => {
        const categories = generateCategories(projects);
        set({ 
          projects, 
          categories,
          error: null 
        });
        // Auto-filter after setting projects
        get().filterProjects();
      },

      setFilter: (newFilter: Partial<FilterState>) => {
        set(state => ({ 
          filter: { ...state.filter, ...newFilter } 
        }));
        // Auto-filter after setting filter
        get().filterProjects();
      },

      filterProjects: () => {
        const { projects, filter } = get();
        
        if (projects.length === 0) {
          set({ filteredProjects: [] });
          return;
        }

        let filtered = [...projects];

        // Category filter using Sift
        if (filter.activeCategory !== 'ทั้งหมด') {
          filtered = filtered.filter(sift({ category: filter.activeCategory }));
        }

        // Search filter using Sift for complex queries
        if (filter.searchQuery.trim()) {
          const searchTerms = filter.searchQuery.trim().toLowerCase().split(' ');
          
          // Create Sift query for text search across multiple fields
          const searchQuery = {
            $or: [
              { title: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
              { location: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
              { type: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
              { client: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
              { 
                description: {
                  $or: [
                    { $regex: new RegExp(searchTerms.join('|'), 'i') },
                    { $all: searchTerms.map(term => ({ $regex: new RegExp(term, 'i') })) }
                  ]
                }
              }
            ]
          };

          filtered = filtered.filter(sift(searchQuery));
        }

        // Sorting
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (filter.sortBy) {
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'newest':
            case 'oldest':
              aValue = a.completionDate ? new Date(a.completionDate).getTime() : new Date(Number(a.year), 0).getTime();
              bValue = b.completionDate ? new Date(b.completionDate).getTime() : new Date(Number(b.year), 0).getTime();
              break;
            default:
              return 0;
          }

          if (filter.sortBy === 'oldest') {
            // For oldest, we want ascending order by date
            return aValue - bValue;
          } else if (filter.sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
          } else {
            return aValue > bValue ? 1 : -1;
          }
        });

        set({ filteredProjects: filtered });
      },

      resetFilter: () => {
        set({ filter: initialFilterState });
        get().filterProjects();
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),

      // Computed getters
      getProjectBySlug: (slug: string) => {
        const { projects } = get();
        return projects.find(project => project.slug === slug || project.id === slug);
      },

      getProjectsByCategory: (category: string) => {
        const { projects } = get();
        if (category === 'ทั้งหมด') return projects;
        return projects.filter(sift({ category }));
      },

      getRelatedProjects: (project: Project, limit = 4) => {
        const { projects } = get();
        
        // Use Sift to find related projects with sophisticated matching
        const relatedQuery = {
          $and: [
            { id: { $ne: project.id } }, // Exclude current project
            {
              $or: [
                { category: project.category }, // Same category
                { type: project.type }, // Same type
                { location: { $regex: new RegExp(project.location.split(' ')[0], 'i') } }, // Similar location
              ]
            }
          ]
        };

        let related = projects.filter(sift(relatedQuery));

        // Sort by relevance (same category first, then same type, then similar location)
        related.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          
          if (a.category === project.category) scoreA += 3;
          if (b.category === project.category) scoreB += 3;
          
          if (a.type === project.type) scoreA += 2;
          if (b.type === project.type) scoreB += 2;
          
          if (a.location.includes(project.location.split(' ')[0])) scoreA += 1;
          if (b.location.includes(project.location.split(' ')[0])) scoreB += 1;
          
          return scoreB - scoreA;
        });

        return related.slice(0, limit);
      },
    }),
    {
      name: 'portfolio-store',
      // Only enable devtools in development
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Helper function to generate categories with counts
function generateCategories(projects: Project[]): Array<{ name: string; count: number }> {
  const categoryCount = projects.reduce((acc, project) => {
    const category = project.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category]++;
    return acc;
  }, {} as Record<string, number>);

  const categoryList = [
    { name: 'ทั้งหมด', count: projects.length },
    ...Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  ];

  return categoryList;
}

// Selectors for optimized component subscriptions
export const useProjects = () => usePortfolioStore(state => state.projects);
export const useFilteredProjects = () => usePortfolioStore(state => state.filteredProjects);
export const useCategories = () => usePortfolioStore(state => state.categories);
export const useFilter = () => usePortfolioStore(state => state.filter);
export const usePortfolioLoading = () => usePortfolioStore(state => state.isLoading);
export const usePortfolioError = () => usePortfolioStore(state => state.error);