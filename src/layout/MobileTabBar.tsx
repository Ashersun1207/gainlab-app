export type MobileTab = 'market' | 'tools' | 'chat';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: Array<{ key: MobileTab; icon: string; label: string }> = [
  { key: 'market', icon: '📊', label: '市场' },
  { key: 'tools', icon: '🔧', label: '工具' },
  { key: 'chat', icon: '💬', label: '聊天' },
];

/**
 * 移动端底部 Tab Bar
 * 固定在底部，56px 高度 + safe-area-inset-bottom
 */
export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex bg-[#0a0a1a] border-t border-[#1e1e3a] z-50 safe-area-bottom">
      {TABS.map(({ key, icon, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
            ${activeTab === key ? 'text-[#60a5fa]' : 'text-[#6666aa]'}`}
        >
          <span className="text-lg leading-none mb-0.5">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
