import { Card, Badge, StatBox, ProgressBar } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  protocolVersion, sortingStatistics, plcStatus, sortingResults,
  scadaData, swAlarms, swSortingStats,
} from '../data/demoData';

const hourlyData = [
  { hour: '08시', count: 850 }, { hour: '09시', count: 1200 }, { hour: '10시', count: 1400 },
  { hour: '11시', count: 1350 }, { hour: '12시', count: 800 }, { hour: '13시', count: 1100 },
  { hour: '14시', count: 1500 }, { hour: '15시', count: 1450 }, { hour: '16시', count: 1300 },
  { hour: '17시', count: 1050 }, { hour: '18시', count: 600 }, { hour: '19시', count: 400 },
];

const concentrationOffices = [
  { name: '서울우편집중국', processed: 15000, rate: 94.7, status: 'NORMAL' },
  { name: '대전우편집중국', processed: 12500, rate: 95.2, status: 'NORMAL' },
  { name: '대구우편집중국', processed: 11200, rate: 93.1, status: 'WARNING' },
  { name: '부산우편집중국', processed: 13800, rate: 96.0, status: 'NORMAL' },
  { name: '광주우편집중국', processed: 9500, rate: 94.5, status: 'NORMAL' },
];

export default function DashboardPage() {
  const s = sortingStatistics;
  const recentAlarms = swAlarms.filter((a) => a.status === 'ACTIVE').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="프로토콜 버전">
          <StatBox label="버전" value={`v${protocolVersion.version}`} sub={protocolVersion.status} color="text-blue-600" />
        </Card>
        <Card title="총 처리">
          <StatBox label="건" value={s.totalProcessed} color="text-kpost-primary" />
        </Card>
        <Card title="성공">
          <StatBox label="건" value={s.successCount} color="text-green-600" />
        </Card>
        <Card title="리젝트">
          <StatBox label="건" value={s.rejectCount + s.noReadCount} sub={`리젝트 ${s.rejectCount} / 미인식 ${s.noReadCount}`} color="text-red-600" />
        </Card>
        <Card title="처리량">
          <StatBox label="/h" value={s.throughput.toLocaleString()} color="text-purple-600" />
        </Card>
        <Card title="가동률">
          <StatBox label="%" value={`${s.availability}%`} sub={`가동 ${s.operatingHours}분`} color="text-kpost-success" />
        </Card>
      </div>

      {/* 집중국별 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {concentrationOffices.map((office) => (
          <Card key={office.name} title={office.name}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${office.status === 'NORMAL' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
              <Badge text={office.status} color={office.status === 'NORMAL' ? 'green' : 'yellow'} />
            </div>
            <div className="text-xl font-bold dark:text-gray-100">{office.processed.toLocaleString()}<span className="text-xs text-gray-400 ml-1">건</span></div>
            <div className="mt-1">
              <ProgressBar value={office.rate} max={100} color={office.rate >= 95 ? 'bg-green-500' : office.rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'} />
              <div className="text-xs text-gray-400 mt-0.5 text-right">{office.rate}%</div>
            </div>
          </Card>
        ))}
      </div>

      {/* 시간당 처리량 차트 + 슈트 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="시간당 처리량">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a56db" radius={[4, 4, 0, 0]} name="처리량" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="슈트 현황판">
          <div className="grid grid-cols-5 gap-2">
            {plcStatus.chutes.map((c) => (
              <div key={c.no} className={`p-2 rounded border text-center text-xs ${c.full ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : c.rate > 60 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'}`}>
                <div className="font-bold text-base dark:text-gray-200">#{c.no}</div>
                <div className="font-medium dark:text-gray-300">{c.dest}</div>
                <div className="mt-1 dark:text-gray-400">{c.count}건</div>
                <ProgressBar value={c.rate} max={100} color={c.full ? 'bg-red-500' : c.rate > 60 ? 'bg-yellow-500' : 'bg-green-500'} />
                <div className="text-gray-400 mt-0.5">{c.rate}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 최근 분류 결과 + 알람 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="최근 분류 결과" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">바코드</th><th>구분코드</th><th>슈트</th><th>결과</th><th>목적지</th></tr></thead>
            <tbody>
              {sortingResults.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-1.5 font-mono text-xs">{r.barcode || '-'}</td>
                  <td>{r.sortCode || '-'}</td>
                  <td>{r.chute || '-'}</td>
                  <td><Badge text={r.result} color={r.result === 'SUCCESS' ? 'green' : 'red'} /></td>
                  <td className="text-sm dark:text-gray-300">{r.dest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="최근 알람">
          <div className="space-y-2">
            {recentAlarms.length === 0 && <div className="text-sm text-gray-400">활성 알람 없음</div>}
            {recentAlarms.map((a) => (
              <div key={a.id} className={`p-2.5 rounded border text-xs ${a.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : a.severity === 'WARNING' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge text={a.severity} color={a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'yellow' : 'blue'} />
                  <span className="font-mono text-gray-400">{a.id}</span>
                </div>
                <div className="font-medium dark:text-gray-200">{a.message}</div>
                <div className="text-gray-400 mt-1">{a.equipmentName}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SCADA */}
      <Card title="SCADA 환경 데이터">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: '장비 온도', value: `${scadaData.temperature}\u00B0C`, pct: scadaData.temperature, max: 80, color: scadaData.temperature > 60 ? 'bg-red-500' : 'bg-blue-500' },
            { label: '습도', value: `${scadaData.humidity}%`, pct: scadaData.humidity, max: 100, color: 'bg-cyan-500' },
            { label: '진동 레벨', value: `${scadaData.vibration}`, pct: scadaData.vibration * 100, max: 100, color: 'bg-purple-500' },
            { label: '전력 소비', value: `${scadaData.powerConsumption} kW`, pct: scadaData.powerConsumption, max: 150, color: 'bg-orange-500' },
            { label: '소음', value: `${scadaData.noiseLevel} dB`, pct: scadaData.noiseLevel, max: 100, color: 'bg-gray-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="font-medium dark:text-gray-300">{item.value}</span>
              </div>
              <ProgressBar value={item.pct} max={item.max} color={item.color} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
