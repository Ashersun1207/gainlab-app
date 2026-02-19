/**
 * SidebarToggle — Hamburger button for expanding/collapsing sidebar.
 * Collapsed: hamburger with right arrow (expand indicator).
 * Expanded: hamburger with left arrow (collapse indicator).
 * Matches preview-layout.html toggle button.
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
        /* Collapse icon: left arrow + hamburger lines */
        <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,2 3,4.5 6,7" />
          <line x1="3" y1="4.5" x2="15" y2="4.5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13.5" x2="15" y2="13.5" />
        </svg>
      ) : (
        /* Expand icon: hamburger lines + right arrow */
        <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12,2 15,4.5 12,7" />
          <line x1="3" y1="4.5" x2="15" y2="4.5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13.5" x2="15" y2="13.5" />
        </svg>
      )}
    </button>
  );
}
