export type KeyboardSection = 'hero' | 'discovery' | 'skills' | 'projects' | 'writing' | 'experience' | 'contact';
export type SectionAnchor = { id: KeyboardSection; top: number };
export type SectionBounds = { top: number; bottom: number };

export const isSkillsSection = (section: KeyboardSection): boolean => section === 'skills';
export const isReadingSection = (section: KeyboardSection): boolean => !isSkillsSection(section);

/** Anchors arrive in DOM order; the keyboard is active only across the skills section bounds. */
export function resolveKeyboardSection(
  anchors: readonly SectionAnchor[],
  viewportHeight: number,
  skillsBounds?: SectionBounds,
): KeyboardSection {
  const midpoint = viewportHeight * 0.5;
  if (skillsBounds && skillsBounds.top <= midpoint && skillsBounds.bottom > midpoint) return 'skills';
  const current = [...anchors].reverse().find(anchor => anchor.id !== 'skills' && anchor.top <= midpoint);
  return current?.id ?? anchors.find(anchor=>anchor.id!=='skills')?.id ?? 'hero';
}
