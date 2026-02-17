interface ChatToggleProps {
  onClick: () => void;
}

export function ChatToggle({ onClick }: ChatToggleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-6 z-50 flex h-12 w-12 items-center justify-center
                 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8]
                 text-xl text-white shadow-lg shadow-[#2563eb]/25
                 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-[#2563eb]/40"
      title="打开 AI 助手"
    >
      💬
    </button>
  );
}
