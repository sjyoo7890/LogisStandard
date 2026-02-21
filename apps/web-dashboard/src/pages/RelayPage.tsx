import { useState } from 'react';
import { Card, Badge, StatBox, ProgressBar } from '../components/ui';
import {
  relayConnections, syncHistory, ftpTransfers, commLogs,
  relayConfig, fallbackDetailState, relayApiEndpoints, relayWsEndpoints, relayTestResults,
  localPlcChannels, localEquipment, localIpsDevices, localSimulatorStats,
  localSortingRules, localOperationMode, localRelayTestResults,
  localApiEndpoints, localWsEndpoints,
} from '../data/demoData';

type RelayTab = 'central' | 'local';

export default function RelayPage() {
  const [tab, setTab] = useState<RelayTab>('central');

  const connectedCount = relayConnections.filter((c) => c.status === 'CONNECTED').length;
  const errorCount = relayConnections.filter((c) => c.status === 'ERROR').length;
  const systemStatus = errorCount === 0 ? 'HEALTHY' : errorCount <= 1 ? 'DEGRADED' : 'CRITICAL';

  const connectedChannels = localPlcChannels.filter((c) => c.status === 'CONNECTED').length;
  const runningEquipment = localEquipment.filter((e) => e.status === 'RUNNING').length;

  return (
    <div className="space-y-6">
      {/* Tab switch */}
      <div className="flex gap-2">
        <button onClick={() => setTab('central')} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === 'central' ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          중앙 중계기
        </button>
        <button onClick={() => setTab('local')} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === 'local' ? 'bg-kpost-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          로컬 중계기
        </button>
      </div>

      {tab === 'central' && (
        <>
          {/* Central KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card title="시스템 상태"><StatBox label="" value={systemStatus} color={systemStatus === 'HEALTHY' ? 'text-green-600' : 'text-yellow-600'} /></Card>
            <Card title="연결"><StatBox label="대상" value={`${connectedCount}/${relayConnections.length}`} color={errorCount === 0 ? 'text-green-600' : 'text-yellow-600'} /></Card>
            <Card title="단위 테스트"><StatBox label="pass" value={`${relayTestResults.unit.passed}/${relayTestResults.unit.total}`} color="text-green-600" /></Card>
            <Card title="E2E 테스트"><StatBox label="pass" value={`${relayTestResults.e2e.passed}/${relayTestResults.e2e.total}`} color="text-green-600" /></Card>
            <Card title="REST API"><StatBox label="EP" value={relayApiEndpoints.length} color="text-blue-600" /></Card>
            <Card title="Fallback"><StatBox label="" value={fallbackDetailState.status} color="text-green-600" /></Card>
          </div>

          {/* 연결 상태 */}
          <Card title="집중국 연결 상태">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relayConnections.map((conn) => (
                <div key={conn.id} className={`p-3 rounded-lg border-2 ${conn.status === 'CONNECTED' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="font-bold text-sm dark:text-gray-200">{conn.name}</span>
                    </div>
                    <Badge text={conn.status} color={conn.status === 'CONNECTED' ? 'green' : 'red'} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>Host: <span className="font-mono">{conn.host}:{conn.port}</span></div>
                    <div>Latency: <span className="font-bold">{conn.latency}ms</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 동기화 이력 */}
          <Card title="데이터 동기화 이력">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">ID</th><th>방향</th><th>유형</th><th>대상</th><th>레코드</th><th>상태</th><th>시각</th></tr></thead>
              <tbody>
                {syncHistory.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-1.5 font-mono text-xs text-gray-400">{s.id}</td>
                    <td><Badge text={s.direction} color={s.direction.startsWith('SIMS') ? 'blue' : 'purple'} /></td>
                    <td className="text-xs font-medium dark:text-gray-300">{s.type}</td>
                    <td className="text-xs dark:text-gray-400">{s.target}</td>
                    <td className="text-xs font-mono dark:text-gray-300">{s.processed}/{s.records}</td>
                    <td><Badge text={s.status} color={s.status === 'COMPLETED' ? 'green' : 'red'} /></td>
                    <td className="text-xs font-mono text-gray-400">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* FTP + 설정 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="FTP 전송 현황">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">파일명</th><th>유형</th><th>크기</th><th>상태</th></tr></thead>
                <tbody>
                  {ftpTransfers.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-1.5 text-xs font-mono dark:text-gray-300">{f.fileName}</td>
                      <td><Badge text={f.type} color={f.type === 'ADDRESS_DB' ? 'blue' : 'purple'} /></td>
                      <td className="text-xs font-mono dark:text-gray-400">{f.size}</td>
                      <td><Badge text={f.status} color={f.status === 'COMPLETED' ? 'green' : 'red'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="중계기 설정">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">SIMS 연결</div>
                  <div className="grid grid-cols-2 gap-1 text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <div className="dark:text-gray-300">Host: <span className="font-mono font-bold">{relayConfig.sims.host}</span></div>
                    <div className="dark:text-gray-300">Port: <span className="font-mono font-bold">{relayConfig.sims.port}</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">프로토콜</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2"><div className="font-medium text-blue-800 dark:text-blue-300">DB2DB</div><div className="dark:text-gray-400">배치: {relayConfig.protocol.db2db.batchSize}건</div></div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-2"><div className="font-medium text-green-800 dark:text-green-300">FTP</div><div className="dark:text-gray-400">동시: {relayConfig.protocol.ftp.maxConcurrent}건</div></div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2"><div className="font-medium text-purple-800 dark:text-purple-300">Socket</div><div className="dark:text-gray-400">최대: {relayConfig.protocol.socket.maxConnections}연결</div></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Fallback + API + WS */}
          <Card title="Fallback 이벤트 이력">
            <div className="flex items-center gap-4 mb-4">
              <Badge text={fallbackDetailState.status} color="green" />
              <span className="text-xs text-gray-400">대기: {fallbackDetailState.pendingRecords}건 | CSV: {fallbackDetailState.csvFilesGenerated}개</span>
            </div>
            <div className="space-y-2">
              {fallbackDetailState.events.map((ev, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded border text-sm ${ev.type.includes('DOWN') || ev.type.includes('ACTIVATED') ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : ev.type.includes('COMPLETED') ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'}`}>
                  <span className="font-mono text-xs text-gray-400 w-36 shrink-0">{ev.time}</span>
                  <Badge text={ev.type} color={ev.type.includes('DOWN') ? 'red' : ev.type.includes('COMPLETED') ? 'green' : 'blue'} />
                  <span className="text-xs dark:text-gray-300">{ev.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'local' && (
        <>
          {/* Local KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card title="운영 모드"><StatBox label="" value={localOperationMode.currentMode} color="text-purple-600" /></Card>
            <Card title="PLC 채널"><StatBox label={`/ ${localPlcChannels.length}`} value={connectedChannels} color="text-green-600" /></Card>
            <Card title="장비"><StatBox label={`/ ${localEquipment.length}`} value={runningEquipment} color="text-green-600" /></Card>
            <Card title="시뮬레이터"><StatBox label="아이템" value={localSimulatorStats.totalItems} sub={localSimulatorStats.running ? '실행중' : '정지'} color="text-orange-600" /></Card>
            <Card title="단위 테스트"><StatBox label="pass" value={`${localRelayTestResults.unit.passed}/${localRelayTestResults.unit.total}`} color="text-green-600" /></Card>
            <Card title="E2E"><StatBox label="pass" value={`${localRelayTestResults.e2e.passed}/${localRelayTestResults.e2e.total}`} color="text-green-600" /></Card>
          </div>

          {/* PLC 채널 */}
          <Card title="PLC TCP/IP 통신 채널">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">채널명</th><th>포트</th><th>방향</th><th>상태</th><th>송신</th><th>수신</th></tr></thead>
              <tbody>
                {localPlcChannels.map((ch) => (
                  <tr key={ch.name} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-1.5 font-medium text-sm dark:text-gray-300">{ch.name}</td>
                    <td className="font-mono text-xs dark:text-gray-400">:{ch.port}</td>
                    <td><Badge text={ch.dir} color={ch.dir === 'SEND' ? 'blue' : 'green'} /></td>
                    <td><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${ch.status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} /><Badge text={ch.status} color={ch.status === 'CONNECTED' ? 'green' : 'gray'} /></div></td>
                    <td className="font-mono text-xs dark:text-gray-400">{ch.telegramsSent.toLocaleString()}</td>
                    <td className="font-mono text-xs dark:text-gray-400">{ch.telegramsReceived.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* IPS 디바이스 */}
          <Card title="IPS (BCR) 디바이스">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {localIpsDevices.map((d) => (
                <div key={d.deviceId} className={`p-3 rounded-lg border ${d.status === 'ONLINE' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm dark:text-gray-200">{d.name}</span>
                    <Badge text={d.status} color={d.status === 'ONLINE' ? 'green' : 'gray'} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-400">
                    <div>총 판독: <span className="font-bold">{d.totalReads.toLocaleString()}</span></div>
                    <div>성공률: <span className="text-green-600">{d.successRate.toFixed(1)}%</span></div>
                  </div>
                  {d.totalReads > 0 && <ProgressBar value={d.successRate} max={100} color={d.successRate >= 95 ? 'bg-green-500' : 'bg-yellow-500'} />}
                </div>
              ))}
            </div>
          </Card>

          {/* 운영 모드 전환 + 시뮬레이터 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="운영 모드 전환">
              <div className="flex items-center gap-4 mb-4">
                <Badge text={localOperationMode.currentMode} color="purple" />
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded font-medium">SIMULATOR</span>
                  <span>&#8644;</span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded font-medium">OPERATION</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {localOperationMode.safetyCheck.checks.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className={c.passed ? 'text-green-500' : 'text-red-500'}>{c.passed ? '\u2713' : '\u2717'}</span>
                    <span className="font-medium dark:text-gray-300">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{c.detail}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="시뮬레이터 제어">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${localSimulatorStats.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <Badge text={localSimulatorStats.running ? 'RUNNING' : 'STOPPED'} color={localSimulatorStats.running ? 'green' : 'gray'} />
                <span className="text-xs text-gray-400">{localSimulatorStats.itemsPerMinute}/분</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded"><div className="text-lg font-bold dark:text-gray-200">{localSimulatorStats.totalItems}</div><div className="text-xs text-gray-500 dark:text-gray-400">전체</div></div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded"><div className="text-lg font-bold text-green-600">{localSimulatorStats.successCount}</div><div className="text-xs text-gray-500 dark:text-gray-400">성공</div></div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded"><div className="text-lg font-bold text-red-600">{localSimulatorStats.rejectCount}</div><div className="text-xs text-gray-500 dark:text-gray-400">리젝트</div></div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded"><div className="text-lg font-bold text-orange-600">{localSimulatorStats.noReadCount}</div><div className="text-xs text-gray-500 dark:text-gray-400">미인식</div></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">구분 규칙</div>
              <div className="space-y-1">
                {localSortingRules.map((r) => (
                  <div key={r.rule} className={`flex items-center gap-2 p-1.5 rounded text-xs ${r.active ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
                    <Badge text={r.rule} color={r.active ? 'blue' : 'gray'} />
                    <span className={`dark:text-gray-300 ${r.active ? 'font-medium' : 'text-gray-500'}`}>{r.description}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
