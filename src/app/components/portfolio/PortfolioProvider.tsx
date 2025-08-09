'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '../../../store/portfolioStore';
import { Project } from '../../../lib/firestore';

interface PortfolioProviderProps {
  projects: Project[];
  children: React.ReactNode;
}

export default function PortfolioProvider({ projects, children }: PortfolioProviderProps) {
  const { setProjects, setLoading, setError } = usePortfolioStore();

  useEffect(() => {
    if (projects && projects.length > 0) {
      setLoading(true);
      try {
        setProjects(projects);
        setError(null);
      } catch (error) {
        console.error('Error setting projects in store:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
  }, [projects, setProjects, setLoading, setError]);

  return <>{children}</>;
}