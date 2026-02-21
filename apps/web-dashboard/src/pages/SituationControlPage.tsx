import { Card, Badge, StatBox, ProgressBar } from '../components/ui';
import {
  swSituationOverview, swDeliveryPoints, swAlarms, swCommStatuses,
  swSorterStats,
} from '../data/demoData';

export default function SituationControlPage() {
  const activeAlarms = swAlarms.filter((a) => a.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* 종합현황 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="총 처리">
          <StatBox label="건" value={swSituationOverview.totalProcessed} color="text-kpost-primary" />
        </Card>
        <Card title="성공률">
          <StatBox label="%" value={`${swSituationOverview.successRate}%`} color="text-green-600" />
        </Card>
        <Card title="가동 구분기">
          <StatBox label={`/ ${swSituationOverview.totalSorters}`} value={swSituationOverview.activeSorters} color="text-blue-600" />
        </Card>
        <Card title="가동시간">
          <StatBox label="분" value={swSituationOverview.uptimeMinutes} sub={`${Math.floor(swSituationOverview.uptimeMinutes / 60)}h ${swSituationOverview.uptimeMinutes % 60}m`} color="text-purple-600" />
        </Card>
        <Card title="알람">
          <StatBox label="활성" value={activeAlarms.length} color={activeAlarms.length > 0 ? 'text-yellow-600' : 'text-green-600'} />
        </Card>
        <Card title="장비 통신">
          <StatBox label="연결" value={`${swCommStatuses.filter((c) => c.connected).length}/${swCommStatuses.length}`} color="text-green-600" />
        </Card>
      </div>

      {/* 구분기별 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swSorterStats.map((s) => (
          <Card key={s.sorterId} title={s.name}>
            <div className="flex items-center justify-between mb-3">
              <Badge text="RUNNING" color="green" />
              <span className="font-mono font-bold text-lg dark:text-gray-200">{s.totalProcessed.toLocaleString()}건</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-lg font-bold text-blue-600">{s.totalProcessed.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">처리량</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-lg font-bold text-green-600">{s.uptime}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">가동률</div>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-lg font-bold text-red-600">{s.errorCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">에러</div>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={s.uptime} max={100} color="bg-green-500" />
            </div>
          </Card>
        ))}
      </div>

      {/* 배달점별 테이블 */}
      <Card title="배달점별 구분 현황">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              <th className="pb-2">배달점</th>
              <th>지역</th>
              <th>구분수량</th>
              <th>슈트</th>
            </tr>
          </thead>
          <tbody>
            {swDeliveryPoints.map((dp) => (
              <tr key={dp.id} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-2 font-medium dark:text-gray-200">{dp.name}</td>
                <td><Badge text={dp.region} color="blue" /></td>
                <td className="font-mono font-bold dark:text-gray-200">{dp.totalSorted.toLocaleString()}</td>
                <td className="text-xs text-gray-400">{dp.chutes.map((c) => `#${c}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 알람 + 장비 통신 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="활성 알람 메시지">
          {activeAlarms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">✓</div>
              <div>활성 알람 없음</div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlarms.map((a) => (
                <div key={a.id} className={`p-3 rounded border text-sm ${a.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : a.severity === 'WARNING' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge text={a.severity} color={a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'yellow' : 'blue'} />
                    <span className="font-mono text-xs text-gray-400">{a.id}</span>
                  </div>
                  <div className="font-medium dark:text-gray-200">{a.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{a.equipmentName} | {a.detail}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="장비 통신 현황">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">장비ID</th><th>이름</th><th>프로토콜</th><th>상태</th><th>에러</th></tr></thead>
            <tbody>
              {swCommStatuses.map((c) => (
                <tr key={c.equipmentId} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-1.5 font-mono text-xs text-blue-700 dark:text-blue-400">{c.equipmentId}</td>
                  <td className="dark:text-gray-300">{c.name}</td>
                  <td><Badge text={c.protocol} color={c.protocol === 'TCP/IP' ? 'blue' : 'purple'} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${c.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <Badge text={c.connected ? 'CONNECTED' : 'DISCONNECTED'} color={c.connected ? 'green' : 'red'} />
                    </div>
                  </td>
                  <td className={c.errorCount > 0 ? 'text-red-600 font-bold' : 'text-gray-400 dark:text-gray-500'}>{c.errorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
