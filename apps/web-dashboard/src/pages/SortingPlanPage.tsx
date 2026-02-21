import { useState } from 'react';
import { Card, Badge, StatBox } from '../components/ui';
import {
  swSortingPlans, swSortingRules, swSpecialKeys, sortingPlans,
} from '../data/demoData';

export default function SortingPlanPage() {
  const [activePlanIdx, setActivePlanIdx] = useState(0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="구분계획"><StatBox label="건" value={swSortingPlans.length} color="text-blue-600" /></Card>
        <Card title="활성 계획"><StatBox label="" value={swSortingPlans.filter((p) => p.status === 'ACTIVE').length} color="text-green-600" /></Card>
        <Card title="구분규칙"><StatBox label="건" value={swSortingRules.length} color="text-purple-600" /></Card>
        <Card title="특수키"><StatBox label="건" value={swSpecialKeys.length} color="text-orange-600" /></Card>
      </div>

      {/* 계획 목록 */}
      <Card title="구분계획 목록">
        <div className="space-y-2">
          {swSortingPlans.map((plan, i) => (
            <div
              key={plan.id}
              onClick={() => setActivePlanIdx(i)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                i === activePlanIdx
                  ? 'border-kpost-primary bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Badge text={plan.status} color={plan.status === 'ACTIVE' ? 'green' : 'gray'} />
                <span className="font-medium dark:text-gray-200">{plan.name}</span>
                <span className="font-mono text-xs text-gray-400">{plan.id}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{plan.rulesCount}개 규칙</span>
                {plan.status === 'ACTIVE' && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 구분규칙 + FTP 구분계획 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="구분규칙">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {swSortingRules.map((r) => (
              <div key={r.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-center text-xs">
                <div className="font-mono font-bold dark:text-gray-200">{r.pattern}</div>
                <div className="text-blue-700 dark:text-blue-400">{r.dest}</div>
                <div className="text-gray-400">슈트 {r.chute}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="FTP 구분계획 파일">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700"><th className="pb-2">구분코드</th><th>목적지</th><th>슈트</th><th>우선순위</th></tr></thead>
            <tbody>
              {sortingPlans.map((p) => (
                <tr key={p.sortCode} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-1.5 font-mono dark:text-gray-300">{p.sortCode}</td>
                  <td className="dark:text-gray-300">{p.destName} <span className="text-gray-400 text-xs">({p.dest})</span></td>
                  <td className="font-bold dark:text-gray-200">#{p.chute}</td>
                  <td><Badge text={`P${p.priority}`} color={p.priority === 1 ? 'blue' : 'gray'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* 특수키 관리 */}
      <Card title="특수키 관리">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {swSpecialKeys.map((k) => (
            <div key={k.keyCode} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-lg dark:text-gray-200">{k.keyCode}</span>
                <Badge text="ACTIVE" color="green" />
              </div>
              <div className="text-sm dark:text-gray-300">{k.destination}</div>
              <div className="text-xs text-gray-400 mt-1">슈트 #{k.chuteNumber}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
