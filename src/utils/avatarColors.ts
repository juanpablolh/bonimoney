/**
 * Pastel avatar colors using Tailwind 200/800 variants
 * Softer backgrounds with darker, more readable text
 */
export const CARBON_TAG_COLORS = [
  { bg: '#BFDBFE', text: '#1E3A8A' }, // blue-200 / blue-800
  { bg: '#FECACA', text: '#991B1B' }, // red-200 / red-800
  { bg: '#BBF7D0', text: '#166534' }, // green-200 / green-800
  { bg: '#E9D5FF', text: '#6B21A8' }, // purple-200 / purple-800
  { bg: '#BAE6FD', text: '#075985' }, // sky-200 / sky-800
  { bg: '#99F6E4', text: '#115E59' }, // teal-200 / teal-800
  { bg: '#FED7AA', text: '#9A3412' }, // orange-200 / orange-800
  { bg: '#C7D2FE', text: '#3730A3' }, // indigo-200 / indigo-800
  { bg: '#FBCFE8', text: '#9F1239' }, // pink-200 / pink-800
  { bg: '#A7F3D0', text: '#065F46' }, // emerald-200 / emerald-800
  { bg: '#FEF08A', text: '#854D0E' }, // yellow-200 / yellow-800
  { bg: '#DDD6FE', text: '#5B21B6' }, // violet-200 / violet-800
  { bg: '#FBCFE8', text: '#831843' }, // rose-200 / rose-800
  { bg: '#A5F3FC', text: '#155E75' }, // cyan-200 / cyan-800
];

/**
 * Gets an available color from Carbon Design System tag colors
 * Used when adding a new member - avoids repeating colors already assigned
 */
export function getAvailableColor(existingMembers: { avatarColor?: { bg: string; text: string } }[]): { bg: string; text: string } {
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
export function getMemberAvatarColor(member: { name: string; avatarColor?: { bg: string; text: string } }): { bg: string; text: string } {
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

