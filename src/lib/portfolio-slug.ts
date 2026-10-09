import type { Project } from '@/features/projects/types';

type PortfolioSlugInput = Pick<Project, "type" | "width" | "extension">;

/** Build a stable, readable portfolio URL for a newly created project. */
export function generatePortfolioSlug(
  project: PortfolioSlugInput,
  uniqueSuffix: string
): string {
  const systemPrefix = project.type === "มอเตอร์ไฟฟ้า"
    ? "electric-awning"
    : "retractable-awning";
  const size = `${project.width}x${project.extension}`.replaceAll(".", "-");

  return `${systemPrefix}-${size}-${uniqueSuffix}`.toLowerCase();
}
