/**
 * SidebarToggle — Hamburger button for expanding/collapsing sidebar.
 * Collapsed: hamburger centered.
 * Expanded: hamburger on right side with ← arrow.
 */

interface SidebarToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ expanded, onToggle }: SidebarToggleProps) {
  return (
    <button
      className="sb-toggle"
      onClick={onToggle}
      aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      data-testid="sidebar-toggle"
    >
      {expanded ? (
        <>
          <span className="sb-toggle-arrow">←</span>
          <HamburgerIcon />
        </>
      ) : (
        <HamburgerIcon />
      )}
    </button>
  );
}

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      className="sb-hamburger-icon"
    >
      <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
      <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" />
      <rect x="2" y="11.5" width="12" height="1.5" rx="0.5" />
    </svg>
  );
}
