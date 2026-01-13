/**
 * Pastel avatar colors using Tailwind 200/800 variants
 * Softer backgrounds with darker, more readable text
 */
export const CARBON_TAG_COLORS = [
  { bg: 'var(--user-blue-bg)', main: 'var(--user-blue-main)', text: 'var(--user-blue-text)' },
  { bg: 'var(--user-red-bg)', main: 'var(--user-red-main)', text: 'var(--user-red-text)' },
  { bg: 'var(--user-green-bg)', main: 'var(--user-green-main)', text: 'var(--user-green-text)' },
  { bg: 'var(--user-purple-bg)', main: 'var(--user-purple-main)', text: 'var(--user-purple-text)' },
  { bg: 'var(--user-sky-bg)', main: 'var(--user-sky-main)', text: 'var(--user-sky-text)' },
  { bg: 'var(--user-teal-bg)', main: 'var(--user-teal-main)', text: 'var(--user-teal-text)' },
  { bg: 'var(--user-orange-bg)', main: 'var(--user-orange-main)', text: 'var(--user-orange-text)' },
  { bg: 'var(--user-indigo-bg)', main: 'var(--user-indigo-main)', text: 'var(--user-indigo-text)' },
  { bg: 'var(--user-pink-bg)', main: 'var(--user-pink-main)', text: 'var(--user-pink-text)' },
  { bg: 'var(--user-emerald-bg)', main: 'var(--user-emerald-main)', text: 'var(--user-emerald-text)' },
  { bg: 'var(--user-yellow-bg)', main: 'var(--user-yellow-main)', text: 'var(--user-yellow-text)' },
  { bg: 'var(--user-violet-bg)', main: 'var(--user-violet-main)', text: 'var(--user-violet-text)' },
  { bg: 'var(--user-rose-bg)', main: 'var(--user-rose-main)', text: 'var(--user-rose-text)' },
  { bg: 'var(--user-cyan-bg)', main: 'var(--user-cyan-main)', text: 'var(--user-cyan-text)' },
];

/**
 * Gets an available color from Carbon Design System tag colors
 * Used when adding a new member - avoids repeating colors already assigned
 */
export function getAvailableColor(existingMembers: { avatarColor?: { bg: string; main: string; text: string } }[]): { bg: string; main: string; text: string } {
  // Get colors already in use
  const usedColors = new Set(
    existingMembers
      .map(m => m.avatarColor?.bg)
      .filter(Boolean) as string[]
  );

  // Find first available color
  const availableColor = CARBON_TAG_COLORS.find(color => !usedColors.has(color.bg));

  if (availableColor) {
    return availableColor;
  }

  // If all colors are used, find the least used color
  const colorUsage = new Map<string, number>();
  existingMembers.forEach(member => {
    if (member.avatarColor?.bg) {
      colorUsage.set(member.avatarColor.bg, (colorUsage.get(member.avatarColor.bg) || 0) + 1);
    }
  });

  // Find color with minimum usage
  let minUsage = Infinity;
  let leastUsedColor = CARBON_TAG_COLORS[0];

  CARBON_TAG_COLORS.forEach(color => {
    const usage = colorUsage.get(color.bg) || 0;
    if (usage < minUsage) {
      minUsage = usage;
      leastUsedColor = color;
    }
  });

  return leastUsedColor;
}

/**
 * Gets the avatar color for a member
 * Uses the stored color if available, otherwise falls back to hash-based color for backward compatibility
 */
export function getMemberAvatarColor(member: { name: string; avatarColor?: { bg: string; main: string; text: string } }): { bg: string; main: string; text: string } {
  // If member has a stored color, use it
  if (member.avatarColor) {
    return member.avatarColor;
  }

  // Safety check for null/undefined name
  if (!member || !member.name) {
    return CARBON_TAG_COLORS[0]; // Return default color
  }

  // Fallback: Generate a consistent color based on name (for backward compatibility)
  let hash = 0;
  for (let i = 0; i < member.name.length; i++) {
    hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % CARBON_TAG_COLORS.length;
  return CARBON_TAG_COLORS[index];
}

