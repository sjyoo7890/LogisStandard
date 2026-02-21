import { Card, Badge, StatBox, ProgressBar } from '../components/ui';
import {
  plcStatus, localEquipment, localPlcChannels, swLayoutSummary,
  swChuteDisplayData, sortingStatistics,
} from '../data/demoData';

export default function MonitoringPage() {
  const runningCount = localEquipment.filter((e) => e.status === 'RUNNING').length;
  const connectedChannels = localPlcChannels.filter((c) => c.status === 'CONNECTED').length;

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card title="설비 가동">
          <StatBox label={`/ ${localEquipment.length}`} value={runningCount} color="text-green-600" />
        </Card>
        <Card title="PLC 채널">
          <StatBox label={`/ ${localPlcChannels.length}`} value={connectedChannels} color="text-blue-600" />
        </Card>
        <Card title="처리량">
          <StatBox label="/h" value={sortingStatistics.throughput.toLocaleString()} color="text-purple-600" />
        </Card>
        <Card title="트랙">
          <StatBox label="개" value={swLayoutSummary.tracks} color="text-gray-800 dark:text-gray-200" />
        </Card>
        <Card title="인덕션">
          <StatBox label="개" value={swLayoutSummary.inductions} color="text-blue-600" />
        </Card>
        <Card title="컨베이어">
          <StatBox label="개" value={swLayoutSummary.conveyors} color="text-orange-600" />
        </Card>
      </div>

      {/* 구분기 레이아웃 SVG */}
      <Card title="구분기 레이아웃 뷰">
        <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-6 overflow-x-auto">
          <svg viewBox="0 0 800 320" className="w-full min-w-[600px]" style={{ maxHeight: 320 }}>
            {/* Main Track */}
            <rect x="50" y="140" width="700" height="30" rx="4" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" strokeWidth="1.5" />
            <text x="400" y="160" textAnchor="middle" className="text-xs" fill="#3B82F6" fontWeight="bold">메인 트랙 (Main Conveyor)</text>

            {/* Inductions (top) */}
            {[150, 350, 550].map((x, i) => (
              <g key={`ind-${i}`}>
                <rect x={x - 30} y="70" width="60" height="60" rx="6" fill="#8B5CF6" opacity="0.2" stroke="#8B5CF6" strokeWidth="1.5" />
                <text x={x} y="95" textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="bold">IND-{i + 1}</text>
                <text x={x} y="110" textAnchor="middle" fill="#8B5CF6" fontSize="8">인덕션</text>
                <line x1={x} y1="130" x2={x} y2="140" stroke="#8B5CF6" strokeWidth="2" markerEnd="url(#arrow)" />
                {/* IPS/BCR */}
                <rect x={x + 40} y="80" width="40" height="24" rx="3" fill="#F59E0B" opacity="0.3" stroke="#F59E0B" strokeWidth="1" />
                <text x={x + 60} y="96" textAnchor="middle" fill="#F59E0B" fontSize="7" fontWeight="bold">BCR</text>
              </g>
            ))}

            {/* Chutes (bottom) - 10 chutes */}
            {Array.from({ length: 10 }, (_, i) => {
              const x = 100 + i * 65;
              const chute = swChuteDisplayData[i];
              const fillColor = chute?.status === 'FULL' ? '#EF4444' : chute?.status === 'NEAR_FULL' ? '#F59E0B' : '#10B981';
              return (
                <g key={`chute-${i}`}>
                  <line x1={x} y1="170" x2={x} y2="200" stroke={fillColor} strokeWidth="2" />
                  <rect x={x - 25} y="200" width="50" height="40" rx="4" fill={fillColor} opacity="0.2" stroke={fillColor} strokeWidth="1.5" />
                  <text x={x} y="218" textAnchor="middle" fill={fillColor} fontSize="9" fontWeight="bold">#{(chute?.no ?? i + 1)}</text>
                  <text x={x} y="232" textAnchor="middle" fontSize="7" fill="#6B7280">{chute?.dest?.slice(0, 4) ?? ''}</text>
                </g>
              );
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#8B5CF6" />
              </marker>
            </defs>

            {/* Legend */}
            <g transform="translate(600, 260)">
              <rect width="10" height="10" rx="2" fill="#10B981" opacity="0.5" />
              <text x="14" y="9" fontSize="8" fill="#6B7280">정상</text>
              <rect x="50" width="10" height="10" rx="2" fill="#F59E0B" opacity="0.5" />
              <text x="64" y="9" fontSize="8" fill="#6B7280">근접만재</text>
              <rect x="120" width="10" height="10" rx="2" fill="#EF4444" opacity="0.5" />
              <text x="134" y="9" fontSize="8" fill="#6B7280">만재</text>
            </g>
          </svg>
        </div>
      </Card>

      {/* 장비 상태 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="PLC 설비 상태" className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${plcStatus.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-semibold dark:text-gray-200">{plcStatus.equipmentId}</span>
            <Badge text={plcStatus.running ? '가동중' : '정지'} color={plcStatus.running ? 'green' : 'red'} />
            <Badge text={`${plcStatus.speed} m/min`} color="blue" />
            <Badge text={plcStatus.mode} color="purple" />
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">모터</th><th>상태</th><th>속도</th><th>전류</th><th>온도</th></tr></thead>
            <tbody>
              {plcStatus.motors.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-1.5 font-medium dark:text-gray-300">{m.name}</td>
                  <td><Badge text={m.running ? 'RUN' : 'STOP'} color={m.running ? 'green' : 'red'} /></td>
                  <td className="dark:text-gray-300">{m.speed} m/min</td>
                  <td className="dark:text-gray-300">{m.current}A</td>
                  <td className="dark:text-gray-300">{m.temp}&deg;C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="장비 상태 목록">
          <div className="space-y-2">
            {localEquipment.map((eq) => (
              <div key={eq.equipmentId} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700/50 text-sm">
                <div className={`w-2 h-2 rounded-full shrink-0 ${eq.status === 'RUNNING' ? 'bg-green-500 animate-pulse' : eq.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'}`} />
                <span className="font-mono text-xs text-blue-700 dark:text-blue-400 w-16 shrink-0">{eq.equipmentId}</span>
                <span className="truncate dark:text-gray-300">{eq.name}</span>
                <Badge text={eq.status} color={eq.status === 'RUNNING' ? 'green' : eq.status === 'ERROR' ? 'red' : 'gray'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 슈트 실시간 표시 */}
      <Card title="슈트 현황 (실시간)">
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {swChuteDisplayData.map((c) => (
            <div key={c.no} className={`p-2 rounded border text-center text-xs ${c.status === 'FULL' ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : c.status === 'NEAR_FULL' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'}`}>
              <div className="font-bold text-sm dark:text-gray-200">#{c.no}</div>
              <div className="font-medium dark:text-gray-300 truncate">{c.dest}</div>
              <div className="mt-1 dark:text-gray-400">{c.count}건</div>
              <ProgressBar value={c.rate} max={100} color={c.status === 'FULL' ? 'bg-red-500' : c.status === 'NEAR_FULL' ? 'bg-yellow-500' : 'bg-green-500'} />
              <div className="text-gray-400 mt-0.5">{c.rate}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
