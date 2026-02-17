import { useState, useCallback, useRef, useEffect } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchBox({
  onSearch,
  loading = false,
  placeholder = '搜索资产...',
}: SearchBoxProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const trimmed = v.trim();
        // ⚠️ 至少 2 个字符才触发远程搜索（中文 2 字 = 有意义查询）
        if (trimmed.length >= 2) {
          onSearch(trimmed);
        } else if (trimmed.length === 0) {
          onSearch(''); // 清空搜索，恢复热门列表
        }
      }, 300);
    },
    [onSearch],
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="px-2 py-1 relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-[#13132a] border border-[#2a2a4a] rounded-md px-3 py-1.5
                   text-sm text-[#d0d0f0] placeholder-[#4a4a7a]
                   focus:outline-none focus:border-[#4a4a8a] transition-colors"
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <span className="text-[#4a4a7a] text-xs animate-pulse">搜索中...</span>
        </div>
      )}
    </div>
  );
}
