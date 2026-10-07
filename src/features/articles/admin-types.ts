export interface AdminArticleSummary {
  id: string;
  legacy: boolean;
  title: string;
  slug?: string;
  revision?: number;
  hasPublishedSnapshot?: boolean;
  updatedAt?: string;
  status: 'draft' | 'published' | 'published-with-draft-changes' | 'needs-reauthoring';
}
