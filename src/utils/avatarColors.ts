/**
 * Carbon Design System tag colors
 * Based on Carbon's tag color palette for accessibility
 */
export const CARBON_TAG_COLORS = [
  { bg: '#002d9c', text: '#ffffff' }, // blue
  { bg: '#da1e28', text: '#ffffff' }, // red
  { bg: '#198038', text: '#ffffff' }, // green
  { bg: '#8d3f9b', text: '#ffffff' }, // purple
  { bg: '#0072c3', text: '#ffffff' }, // cyan
  { bg: '#007d79', text: '#ffffff' }, // teal
  { bg: '#a2191f', text: '#ffffff' }, // magenta
  { bg: '#004144', text: '#ffffff' }, // dark teal
  { bg: '#0043ce', text: '#ffffff' }, // blue 60
  { bg: '#00539a', text: '#ffffff' }, // blue 70
  { bg: '#6f2c3d', text: '#ffffff' }, // red 80
  { bg: '#0e6027', text: '#ffffff' }, // green 70
  { bg: '#5b21d0', text: '#ffffff' }, // purple 60
  { bg: '#005d5d', text: '#ffffff' }, // teal 70
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
  
  // Fallback: Generate a consistent color based on name (for backward compatibility)
  let hash = 0;
  for (let i = 0; i < member.name.length; i++) {
    hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CARBON_TAG_COLORS.length;
  return CARBON_TAG_COLORS[index];
}

