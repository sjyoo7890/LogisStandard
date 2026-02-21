import { Card, Badge, StatBox } from '../components/ui';
import { swKeyingStations, swKeyingHistory } from '../data/demoData';

const buttonLabels = [
  '서울', '경기', '인천', '강원',
  '대전', '충남', '충북', '세종',
  '대구', '경북', '부산', '경남',
  '광주', '전남', '전북', '제주',
];

export default function KeyingPage() {
  const totalProcessed = swKeyingStations.reduce((s, st) => s + st.processedCount, 0);
  const avgTime = swKeyingHistory.length > 0
    ? (swKeyingHistory.reduce((s, h) => s + h.timeMs, 0) / swKeyingHistory.length / 1000).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="타건기"><StatBox label="대" value={swKeyingStations.length} color="text-blue-600" /></Card>
        <Card title="온라인"><StatBox label="대" value={swKeyingStations.filter((s) => s.status === 'ONLINE').length} color="text-green-600" /></Card>
        <Card title="총 처리"><StatBox label="건" value={totalProcessed} color="text-purple-600" /></Card>
        <Card title="평균 응답"><StatBox label="초" value={`${avgTime}s`} color="text-orange-600" /></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 이미지 영역 (시뮬레이션) */}
        <Card title="우편물 이미지" className="lg:col-span-1">
          <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-2">📧</div>
              <div className="text-sm font-medium">우편물 이미지</div>
              <div className="text-xs mt-1">바코드 스캔 대기중...</div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-center">
            <div className="text-gray-400">현재 바코드</div>
            <div className="font-mono font-bold text-lg text-kpost-primary dark:text-blue-400 mt-1">4201234567890</div>
          </div>
        </Card>

        {/* 16 버튼 패널 */}
        <Card title="행선지 버튼 패널 (16버튼)" className="lg:col-span-1">
          <div className="grid grid-cols-4 gap-2">
            {buttonLabels.map((label, i) => (
              <button
                key={i}
                className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-center cursor-pointer"
              >
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">F{i + 1}</div>
                <div className="font-bold text-sm dark:text-gray-200 mt-0.5">{label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* 타건기 상태 */}
        <Card title="타건기 상태" className="lg:col-span-1">
          <div className="space-y-3">
            {swKeyingStations.map((st) => (
              <div key={st.id} className={`p-3 rounded-lg border ${st.status === 'ONLINE' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold dark:text-gray-200">{st.name}</span>
                  <Badge text={st.status} color={st.status === 'ONLINE' ? 'green' : 'gray'} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <div>버튼: {st.buttons}개</div>
                  <div>처리: {st.processedCount}건</div>
                  <div>운영자: {st.operatorId}</div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${st.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    {st.status === 'ONLINE' ? '활성' : '비활성'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 타건 이력 */}
      <Card title="최근 타건 이력">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">시각</th><th>스테이션</th><th>바코드</th><th>행선지</th><th>슈트</th><th>응답시간</th></tr></thead>
          <tbody>
            {swKeyingHistory.map((h) => (
              <tr key={h.requestId} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-1.5 text-xs text-gray-400">{h.completedAt}</td>
                <td><Badge text={h.stationId} color="blue" /></td>
                <td className="font-mono text-xs dark:text-gray-300">{h.barcode}</td>
                <td className="dark:text-gray-300">{h.dest}</td>
                <td className="text-center dark:text-gray-300">#{h.chute}</td>
                <td className="font-mono text-xs dark:text-gray-400">{(h.timeMs / 1000).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
