// Shared pastel color palette for category/group pickers, used by
// category-form.tsx, group-form.tsx, and category-select-with-add.tsx
// (previously duplicated verbatim across all three).
export const CATEGORY_COLOR_PRESETS = [
  "#8B93F0", // soft indigo
  "#B69EF5", // soft violet
  "#F49AC2", // soft pink
  "#F49494", // soft coral
  "#FDB47A", // soft orange
  "#F6CB6D", // soft amber
  "#86D9A0", // soft green
  "#7FD4E8", // soft cyan
  "#8CC5F0", // soft blue
  "#B7C0CC", // soft gray
  "#7A8AA6", // soft slate
  "#7FD9C4", // soft teal
];

export const CATEGORY_COLOR_DEFAULT = CATEGORY_COLOR_PRESETS[0];

export const TEXT_COLOR_PRESETS = ["#ffffff", "#000000", "#e5e7eb", "#1e293b"];

// Pastel palette for multi-series charts (reports category breakdown fallback,
// debt payoff chart), ordered so adjacent hues stay visually distinct.
export const CHART_COLOR_PRESETS = [
  "#8B93F0", // soft indigo
  "#F49AC2", // soft pink
  "#FDB47A", // soft orange
  "#86D9A0", // soft green
  "#7FD4E8", // soft cyan
  "#B69EF5", // soft violet
  "#F49494", // soft coral
  "#8CC5F0", // soft blue
];
