import { useState } from 'react';
import { Card, Badge, StatBox } from '../components/ui';
import { swAlarms, localAlarms } from '../data/demoData';

type AlarmFilter = 'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

const allAlarms = [
  ...swAlarms.map((a) => ({
    id: a.id,
    severity: a.severity,
    message: a.message,
    equipment: a.equipmentName,
    status: a.status as string,
    detail: a.detail,
    time: '14:20:00',
    action: '',
  })),
  ...localAlarms.map((a) => ({
    id: a.alarmId,
    severity: a.severity,
    message: a.message,
    equipment: a.equipmentId,
    status: a.active ? 'ACTIVE' : 'RESOLVED',
    detail: `${a.zone} | ${a.code}`,
    time: a.occurredAt,
    action: a.active ? '' : '자동 해제',
  })),
];

export default function AlarmsPage() {
  const [filter, setFilter] = useState<AlarmFilter>('ALL');
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [actionText, setActionText] = useState('');

  const activeCount = allAlarms.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = allAlarms.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const resolvedCount = allAlarms.filter((a) => a.status === 'RESOLVED').length;

  const filtered = filter === 'ALL' ? allAlarms : allAlarms.filter((a) => a.status === filter);

  const handleAction = () => {
    setActionModal(null);
    setActionText('');
  };

  const severityColor = (s: string) =>
    s === 'CRITICAL' ? 'red' : s === 'MAJOR' ? 'orange' : s === 'WARNING' ? 'yellow' : 'blue';

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="전체 알람"><StatBox label="건" value={allAlarms.length} color="text-gray-800 dark:text-gray-200" /></Card>
        <Card title="활성"><StatBox label="건" value={activeCount} color={activeCount > 0 ? 'text-red-600' : 'text-green-600'} /></Card>
        <Card title="심각"><StatBox label="CRITICAL" value={criticalCount} color="text-red-600" /></Card>
        <Card title="해결"><StatBox label="건" value={resolvedCount} color="text-green-600" /></Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filter === f ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '활성' : f === 'ACKNOWLEDGED' ? '확인' : '해결'}
            {f !== 'ALL' && <span className="ml-1 text-xs opacity-70">({allAlarms.filter((a) => a.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Alarm list */}
      <Card title={`알람 목록 (${filtered.length}건)`}>
        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-lg border text-sm ${
                a.status === 'ACTIVE'
                  ? a.severity === 'CRITICAL'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : a.severity === 'WARNING'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge text={a.severity} color={severityColor(a.severity)} />
                  <span className="font-mono text-xs text-gray-400">{a.id}</span>
                  <Badge text={a.status} color={a.status === 'ACTIVE' ? 'red' : a.status === 'ACKNOWLEDGED' ? 'yellow' : 'green'} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{a.time}</span>
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => setActionModal(a.id)}
                      className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      조치
                    </button>
                  )}
                </div>
              </div>
              <div className="font-medium dark:text-gray-200">{a.message}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{a.equipment}</span>
                <span>|</span>
                <span>{a.detail}</span>
                {a.action && <span className="ml-auto text-green-600">{a.action}</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-gray-200">알람 조치 - {actionModal}</h3>
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="조치사항을 입력하세요..."
              className="w-full border dark:border-gray-700 rounded-lg p-3 text-sm dark:bg-gray-900 dark:text-gray-200 mb-4 h-32 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">취소</button>
              <button onClick={handleAction} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">확인 처리</button>
              <button onClick={handleAction} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">해결 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
