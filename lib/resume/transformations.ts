import { Resume, SectionName } from './schema';
export function emptyEntry(section: SectionName) {
  const id = crypto.randomUUID();
  switch (section) {
    case 'experience':
      return {
        id,
        organization: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [],
        technologies: [],
        url: '',
        details: '',
      };
    case 'projects':
      return {
        id,
        title: 'Untitled project',
        description: '',
        longDescription: '',
        bullets: [],
        technologies: [],
        github: '',
        liveUrl: '',
        images: [],
        architecture: '',
      };
    case 'education':
      return {
        id,
        institution: '',
        degree: '',
        major: '',
        minor: '',
        startDate: '',
        endDate: '',
        location: '',
        coursework: [],
        achievements: [],
      };
    case 'certifications':
      return {
        id,
        name: 'Untitled certification',
        issuer: '',
        issueDate: '',
        credentialId: '',
        credentialUrl: '',
        description: '',
      };
    case 'skills':
      return { id, category: 'New category', items: [] };
  }
}
export function changesBetween(
  a: Resume,
  b: Resume,
): { path: string; before: string; after: string }[] {
  const changes: { path: string; before: string; after: string }[] = [];
  function visit(x: unknown, y: unknown, path: string) {
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (
      x &&
      y &&
      typeof x === 'object' &&
      typeof y === 'object' &&
      !Array.isArray(x) &&
      !Array.isArray(y)
    ) {
      const left = x as Record<string, unknown>,
        right = y as Record<string, unknown>;
      for (const k of new Set([...Object.keys(left), ...Object.keys(right)]))
        if (k !== 'metadata') visit(left[k], right[k], path ? `${path}.${k}` : k);
    } else
      changes.push({
        path,
        before: typeof x === 'string' ? x : (JSON.stringify(x, null, 2) ?? ''),
        after: typeof y === 'string' ? y : (JSON.stringify(y, null, 2) ?? ''),
      });
  }
  visit(a, b, '');
  return changes;
}
