import { Card, Badge, ProgressBar } from '../components/ui';
import { swChuteDisplayData, swChuteStats } from '../data/demoData';

export default function ChuteDisplayPage() {
  const totalItems = swChuteDisplayData.reduce((s, c) => s + c.count, 0);
  const fullCount = swChuteDisplayData.filter((c) => c.status === 'FULL').length;
  const nearFullCount = swChuteDisplayData.filter((c) => c.status === 'NEAR_FULL').length;

  return (
    <div className="space-y-6">
      {/* Header for large display */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">슈트 현황판</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">대형 모니터용 전체 화면 뷰</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="dark:text-gray-300">정상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="dark:text-gray-300">근접만재</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="dark:text-gray-300">만재</span>
          </div>
          <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            총 <span className="font-bold">{totalItems.toLocaleString()}</span>건 |
            만재 <span className="text-red-600 font-bold">{fullCount}</span> |
            근접 <span className="text-yellow-600 font-bold">{nearFullCount}</span>
          </div>
        </div>
      </div>

      {/* 20 Chutes Grid */}
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {swChuteDisplayData.map((c) => (
          <div
            key={c.no}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              c.status === 'FULL'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 shadow-red-200 dark:shadow-red-900 shadow-md'
                : c.status === 'NEAR_FULL'
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 shadow-yellow-200 dark:shadow-yellow-900 shadow-md'
                : 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
            }`}
          >
            <div className="font-bold text-2xl dark:text-gray-100">#{c.no}</div>
            <div className="font-medium text-sm mt-1 dark:text-gray-300">{c.dest}</div>
            <div className="text-lg font-bold mt-2 dark:text-gray-200">{c.count}<span className="text-xs text-gray-400 ml-0.5">건</span></div>
            <div className="mt-2">
              <ProgressBar
                value={c.rate}
                max={100}
                color={c.status === 'FULL' ? 'bg-red-500' : c.status === 'NEAR_FULL' ? 'bg-yellow-500' : 'bg-green-500'}
              />
            </div>
            <div className={`text-sm font-bold mt-1 ${c.status === 'FULL' ? 'text-red-600' : c.status === 'NEAR_FULL' ? 'text-yellow-600' : 'text-green-600'}`}>
              {c.rate}%
            </div>
            {c.status === 'FULL' && (
              <Badge text="만재" color="red" />
            )}
            {c.status === 'NEAR_FULL' && (
              <Badge text="주의" color="yellow" />
            )}
          </div>
        ))}
      </div>

      {/* 슈트별 상세 통계 */}
      <Card title="슈트별 상세 통계">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">슈트</th><th>행선지</th><th>구분수량</th><th>만재 횟수</th><th>근접 만재</th><th>적재율</th></tr></thead>
          <tbody>
            {swChuteStats.map((c) => (
              <tr key={c.chute} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-1.5 font-bold dark:text-gray-200">#{c.chute}</td>
                <td className="dark:text-gray-300">{c.dest}</td>
                <td className="font-mono dark:text-gray-300">{c.items}</td>
                <td className={c.fullCount > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>{c.fullCount}</td>
                <td className={c.nearFullCount > 0 ? 'text-yellow-600' : 'text-gray-400'}>{c.nearFullCount}</td>
                <td className="w-32">
                  <ProgressBar value={c.items} max={350} color={c.items > 280 ? 'bg-red-500' : c.items > 200 ? 'bg-yellow-500' : 'bg-blue-500'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
