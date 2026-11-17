import { getCollection, type CollectionEntry } from 'astro:content';
import type { Body } from './foxsky';
import { MAIN_TAILS } from './foxsky';

export type Project = CollectionEntry<'projects'>;

export async function allProjects(): Promise<Project[]> {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}

/** The tail a project sits on: its `star.planet`, else the bright tail of its domain, else the moon tail. */
export function bodyOf(p: Project): Body {
  const s = p.data.star;
  if (s && 'planet' in s && s.planet in { sun: 1, moon: 1, mercury: 1, venus: 1, mars: 1, jupiter: 1, saturn: 1, uranus: 1, neptune: 1 }) return s.planet as Body;
  return MAIN_TAILS[p.data.domain] ?? 'moon';
}

export const hasNumbers = (p: Project) => p.data.metrics.length > 0;
