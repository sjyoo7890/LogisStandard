import { useState } from 'react';
import { Card, Badge, StatBox } from '../components/ui';
import {
  commLogs, telegramHeader, plcToSmcTelegrams, smcToPlcTelegrams,
  commChannels, binaryDemo, roundTripExample,
} from '../data/demoData';

type LogFilter = 'ALL' | 'ERROR' | 'WARN' | 'INFO';
type ViewMode = 'logs' | 'telegram';

const headerColors: Record<string, string> = {
  red: 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
  orange: 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300',
  blue: 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300',
  purple: 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300',
};

const byteColors: Record<string, string> = {
  red: 'bg-red-800 text-red-200',
  orange: 'bg-orange-800 text-orange-200',
  blue: 'bg-blue-800 text-blue-200',
  green: 'bg-green-800 text-green-200',
  purple: 'bg-purple-800 text-purple-200',
  cyan: 'bg-cyan-800 text-cyan-200',
  yellow: 'bg-yellow-800 text-yellow-200',
  gray: 'bg-gray-700 text-gray-200',
};

export default function LogsPage() {
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('logs');

  const filtered = filter === 'ALL' ? commLogs : commLogs.filter((l) => l.level === filter);
  const errorCount = commLogs.filter((l) => l.level === 'ERROR').length;
  const warnCount = commLogs.filter((l) => l.level === 'WARN').length;

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="전체 로그"><StatBox label="건" value={commLogs.length} color="text-gray-800 dark:text-gray-200" /></Card>
        <Card title="에러"><StatBox label="건" value={errorCount} color="text-red-600" /></Card>
        <Card title="경고"><StatBox label="건" value={warnCount} color="text-yellow-600" /></Card>
        <Card title="채널"><StatBox label="개" value={commChannels.length} color="text-blue-600" /></Card>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2">
        <button onClick={() => setViewMode('logs')} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${viewMode === 'logs' ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>통신 로그</button>
        <button onClick={() => setViewMode('telegram')} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${viewMode === 'telegram' ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>전문 뷰어</button>
      </div>

      {viewMode === 'logs' && (
        <>
          {/* Log filter */}
          <div className="flex gap-2">
            {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-full font-medium ${filter === f ? 'bg-kpost-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Log stream */}
          <Card title={`통신 로그 (${filtered.length}건)`}>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {filtered.map((log) => (
                <div key={log.id} className={`flex items-start gap-2 p-2 rounded text-xs ${log.level === 'ERROR' ? 'bg-red-50 dark:bg-red-900/20' : log.level === 'WARN' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
                  <span className="font-mono text-gray-400 w-16 shrink-0">{log.time}</span>
                  <Badge text={log.level} color={log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'yellow' : 'gray'} />
                  <Badge text={log.direction} color={log.direction === 'INBOUND' ? 'blue' : 'green'} />
                  <span className="text-gray-600 dark:text-gray-300 truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 통신 채널 */}
          <Card title="TCP/IP 통신 채널">
            <div className="space-y-2">
              {commChannels.map((ch) => (
                <div key={ch.name} className={`flex items-center gap-3 p-2.5 rounded border ${ch.dir === 'SEND' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'}`}>
                  <Badge text={ch.dir} color={ch.dir === 'SEND' ? 'blue' : 'green'} />
                  <span className="font-mono font-bold text-sm dark:text-gray-200 w-14">:{ch.port}</span>
                  <span className="font-medium text-sm dark:text-gray-300">{ch.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{ch.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {viewMode === 'telegram' && (
        <>
          {/* 헤더 구조 */}
          <Card title="전문 헤더 구조 (12 Bytes)">
            <div className="flex mb-4 overflow-x-auto">
              {telegramHeader.fields.map((f) => (
                <div key={f.name} className={`flex-none text-center border rounded px-3 py-2 mx-0.5 ${headerColors[f.color] || 'bg-gray-100 dark:bg-gray-700'}`}
                  style={{ minWidth: `${Math.max(f.size * 50, 70)}px` }}>
                  <div className="font-bold text-sm">{f.name}</div>
                  <div className="text-xs opacity-75">{f.size}B ({f.type})</div>
                  <div className="text-xs mt-1">{f.desc}</div>
                </div>
              ))}
              <div className="flex-1 flex items-center justify-center border border-dashed rounded mx-0.5 bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-sm px-3">
                Data (가변)
              </div>
              {telegramHeader.footerFields.map((f) => (
                <div key={f.name} className={`flex-none text-center border rounded px-3 py-2 mx-0.5 ${headerColors[f.color] || 'bg-gray-100 dark:bg-gray-700'}`}
                  style={{ minWidth: '70px' }}>
                  <div className="font-bold text-sm">{f.name}</div>
                  <div className="text-xs opacity-75">{f.size}B ({f.type})</div>
                  <div className="text-xs mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* PLC→SMC / SMC→PLC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="PLC → SMC 전문 (8개)">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2 w-12">No</th><th>전문명</th><th>설명</th><th className="w-14">크기</th></tr></thead>
                <tbody>
                  {plcToSmcTelegrams.map((t) => (
                    <tr key={t.no} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">{t.no}</td>
                      <td className="font-medium dark:text-gray-300">{t.name}</td>
                      <td className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</td>
                      <td className="font-mono text-xs dark:text-gray-400">{t.dataSize}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="SMC → PLC 전문 (12개)">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2 w-12">No</th><th>전문명</th><th>설명</th><th className="w-14">크기</th></tr></thead>
                <tbody>
                  {smcToPlcTelegrams.map((t) => (
                    <tr key={t.no} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-1.5 font-mono font-bold text-purple-600 dark:text-purple-400">{t.no}</td>
                      <td className="font-medium dark:text-gray-300">{t.name}</td>
                      <td className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</td>
                      <td className="font-mono text-xs dark:text-gray-400">{t.dataSize}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* HEX 뷰어 */}
          <Card title={`Round-trip HEX 뷰어: Telegram ${roundTripExample.telegramNo}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">구조체 (입력 데이터)</div>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
{JSON.stringify(roundTripExample.input, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">HEX ({roundTripExample.totalSize} bytes)</div>
                <div className="bg-gray-900 p-3 rounded">
                  <div className="flex flex-wrap gap-1">
                    {roundTripExample.hexBytes.map((b) => (
                      <span key={b.offset} className={`font-mono text-xs px-1.5 py-0.5 rounded ${byteColors[b.color] || 'bg-gray-700 text-gray-200'}`} title={`[${b.offset}] ${b.field}`}>
                        0x{b.byte}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
