import { useState, useCallback, useRef, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultActiveId?: string;
  onTabChange?: (id: string) => void;
}

/**
 * Accessible tab component with keyboard navigation (arrow keys, Home, End).
 */
export function Tabs({ tabs, defaultActiveId, onTabChange }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultActiveId ?? tabs[0]?.id ?? '');
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleTabClick = useCallback(
    (id: string) => {
      setActiveId(id);
      onTabChange?.(id);
    },
    [onTabChange],
  );

  const enabledTabs = tabs.filter((t) => !t.disabled);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = enabledTabs.findIndex((t) => t.id === activeId);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % enabledTabs.length;
          break;
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = enabledTabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextTab = enabledTabs[nextIndex]!;
      setActiveId(nextTab.id);
      onTabChange?.(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    },
    [activeId, enabledTabs, onTabChange],
  );

  const activeTab = tabs.find((t) => t.id === activeId);

  return (
    <div data-testid="tabs">
      <div
        role="tablist"
        aria-label="Tabs"
        className="flex border-b border-gray-200"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeId}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={tab.id === activeId ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 ${
              tab.id === activeId
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          tabIndex={0}
          className="py-4"
          data-testid="tab-panel"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
