import { useState } from 'react';
import { Card, Badge, StatBox, ProgressBar } from '../components/ui';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  swSortingStats, swDailyStats, swChuteStats, swSorterStats,
  sortingStatistics,
} from '../data/demoData';

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const pieData = [
  { name: '성공', value: sortingStatistics.successCount },
  { name: '리젝트', value: sortingStatistics.rejectCount },
  { name: '미인식', value: sortingStatistics.noReadCount },
];

const chuteBarData = swChuteStats.map((c) => ({
  name: `#${c.chute}`,
  items: c.items,
  fullCount: c.fullCount,
}));

const dailyLineData = swDailyStats.map((d) => ({
  date: d.date,
  total: d.totalProcessed,
  success: d.successCount,
  reject: d.rejectCount,
}));

export default function StatisticsPage() {
  const [period, setPeriod] = useState<'today' | '3days' | 'week'>('3days');

  const handleCsvDownload = () => {
    const header = '날짜,총처리,성공,리젝트,재확인,성공률\n';
    const rows = swDailyStats.map((d) =>
      `${d.date},${d.totalProcessed},${d.successCount},${d.rejectCount},${d.recheckCount},${d.successRate}%`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 기간 필터 + CSV */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['today', '3days', 'week'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {p === 'today' ? '오늘' : p === '3days' ? '최근 3일' : '최근 1주'}
            </button>
          ))}
        </div>
        <button
          onClick={handleCsvDownload}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
        >
          CSV 다운로드
        </button>
      </div>

      {/* KPI 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="총 처리">
          <StatBox label="건" value={swSortingStats.totalProcessed} color="text-kpost-primary" />
        </Card>
        <Card title="성공률">
          <StatBox label="%" value={`${swSortingStats.successRate}%`} color="text-green-600" />
        </Card>
        <Card title="리젝트">
          <StatBox label="건" value={swSortingStats.rejectCount} color="text-red-600" />
        </Card>
        <Card title="시간당 처리">
          <StatBox label="/h" value={sortingStatistics.throughput.toLocaleString()} color="text-purple-600" />
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar: 슈트별 구분수 */}
        <Card title="슈트별 구분 수량" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chuteBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Bar dataKey="items" fill="#3B82F6" radius={[0, 4, 4, 0]} name="구분수량" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line: 일별 추이 */}
        <Card title="일별 처리 추이" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyLineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="총처리" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} name="성공" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="reject" stroke="#EF4444" strokeWidth={2} name="리젝트" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie: 결과 비율 */}
        <Card title="분류 결과 비율">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 일별 통계 테이블 */}
      <Card title="일별 통계 상세">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">날짜</th><th>총 처리</th><th>성공</th><th>리젝트</th><th>재확인</th><th>성공률</th></tr></thead>
          <tbody>
            {swDailyStats.map((d) => (
              <tr key={d.date} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="py-1.5 font-medium dark:text-gray-300">{d.date}</td>
                <td className="font-mono dark:text-gray-300">{d.totalProcessed.toLocaleString()}</td>
                <td className="text-green-600 font-mono">{d.successCount.toLocaleString()}</td>
                <td className="text-red-600 font-mono">{d.rejectCount}</td>
                <td className="font-mono dark:text-gray-300">{d.recheckCount}</td>
                <td><Badge text={`${d.successRate}%`} color="green" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 구분기별 현황 */}
      <Card title="구분기별 현황">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {swSorterStats.map((s) => (
            <div key={s.sorterId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg dark:text-gray-200">{s.name}</span>
                <Badge text="RUNNING" color="green" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">처리량</span><span className="font-mono font-bold dark:text-gray-200">{s.totalProcessed.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">가동률</span><span className="font-bold text-green-600">{s.uptime}%</span></div>
                <ProgressBar value={s.uptime} max={100} color="bg-green-500" />
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">에러</span><span className={s.errorCount > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>{s.errorCount}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
