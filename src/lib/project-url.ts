import type { Project } from "./firestore";

/** Return the canonical public path only when a project has a published slug. */
export function getProjectPath(project: Pick<Project, "slug">): string | null {
  if (!project.slug || !/^(retractable|electric)-awning-[a-z0-9-]+-[1-9]\d{0,3}$/.test(project.slug)) {
    return null;
  }

  return `/projects/${project.slug}`;
}
