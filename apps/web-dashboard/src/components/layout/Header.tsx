import { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useSystemStore } from '../../stores/useSystemStore';

export function Header() {
  const { isDark, toggle } = useDarkMode();
  const { wsConnected, alarmCount, systemStatus } = useSystemStore();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColor = systemStatus === 'NORMAL' ? 'bg-green-500' : systemStatus === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-kpost-primary dark:text-blue-400">우정사업본부 자동화설비 통합플랫폼</h1>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {/* System status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-gray-600 dark:text-gray-400">{systemStatus === 'NORMAL' ? '정상' : systemStatus === 'WARNING' ? '주의' : '위험'}</span>
        </div>

        {/* WS connection */}
        <div className="flex items-center gap-1.5" title={wsConnected ? 'WebSocket 연결됨' : 'WebSocket 미연결'}>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">WS</span>
        </div>

        {/* Alarm count */}
        {alarmCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {alarmCount}
          </span>
        )}

        {/* Clock */}
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-20">
          {clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
