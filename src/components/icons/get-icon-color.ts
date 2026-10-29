export default function getIconColor(isSelected: boolean) {
  return {
    style: {
      color: isSelected ? 'var(--ui-accent)' : 'var(--color_label)',
    },
  };
}
