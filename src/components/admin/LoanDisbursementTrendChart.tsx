import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  CheckCircle,
  FileText,
  BarChart2,
  Filter,
} from 'lucide-react';

interface LoanDisbursementTrendChartProps {
  onViewDisbursements?: () => void;
  onViewReports?: () => void;
}

export interface MonthlyDisbursementMetric {
  key: string;
  month: string;
  monthShort: string;
  disbursedAmount: number;
  targetQuota: number;
  loanCount: number;
  avgLoanSize: number;
  growthRate: number; // percentage vs prior month
  commodityAmount: number;
  emergencyAmount: number;
  otherAmount: number;
  isCurrentMonth: boolean;
}

export const LoanDisbursementTrendChart: React.FC<LoanDisbursementTrendChartProps> = ({
  onViewDisbursements,
  onViewReports,
}) => {
  const { activeLoans, applications } = useApp();
  const [metricView, setMetricView] = useState<'volume' | 'count' | 'dual'>('volume');
  const [showTargetQuota, setShowTargetQuota] = useState<boolean>(true);

  // Compute 6-month historical baseline + live releases from active loans
  const chartData: MonthlyDisbursementMetric[] = useMemo(() => {
    // Baseline 6-month data: May 2026 to October 2026
    const baseline: MonthlyDisbursementMetric[] = [
      {
        key: '2026-05',
        month: 'May 2026',
        monthShort: 'May',
        disbursedAmount: 280000,
        targetQuota: 300000,
        loanCount: 14,
        avgLoanSize: 20000,
        growthRate: 0,
        commodityAmount: 180000,
        emergencyAmount: 60000,
        otherAmount: 40000,
        isCurrentMonth: false,
      },
      {
        key: '2026-06',
        month: 'Jun 2026',
        monthShort: 'Jun',
        disbursedAmount: 350000,
        targetQuota: 320000,
        loanCount: 18,
        avgLoanSize: 19444,
        growthRate: 25.0,
        commodityAmount: 220000,
        emergencyAmount: 80000,
        otherAmount: 50000,
        isCurrentMonth: false,
      },
      {
        key: '2026-07',
        month: 'Jul 2026',
        monthShort: 'Jul',
        disbursedAmount: 410000,
        targetQuota: 350000,
        loanCount: 22,
        avgLoanSize: 18636,
        growthRate: 17.1,
        commodityAmount: 260000,
        emergencyAmount: 90000,
        otherAmount: 60000,
        isCurrentMonth: false,
      },
      {
        key: '2026-08',
        month: 'Aug 2026',
        monthShort: 'Aug',
        disbursedAmount: 390000,
        targetQuota: 380000,
        loanCount: 19,
        avgLoanSize: 20526,
        growthRate: -4.9,
        commodityAmount: 240000,
        emergencyAmount: 100000,
        otherAmount: 50000,
        isCurrentMonth: false,
      },
      {
        key: '2026-09',
        month: 'Sep 2026',
        monthShort: 'Sep',
        disbursedAmount: 480000,
        targetQuota: 420000,
        loanCount: 26,
        avgLoanSize: 18461,
        growthRate: 23.1,
        commodityAmount: 310000,
        emergencyAmount: 110000,
        otherAmount: 60000,
        isCurrentMonth: false,
      },
      {
        key: '2026-10',
        month: 'Oct 2026',
        monthShort: 'Oct',
        disbursedAmount: 520000,
        targetQuota: 450000,
        loanCount: 28,
        avgLoanSize: 18571,
        growthRate: 8.3,
        commodityAmount: 340000,
        emergencyAmount: 120000,
        otherAmount: 60000,
        isCurrentMonth: true,
      },
    ];

    // Check if any additional active loans released in Oct 2026 exist
    const octReleasedLoans = activeLoans.filter(l => {
      const date = l.releaseDate || l.releaseInfo?.releasedAt;
      return date && date.startsWith('2026-10');
    });

    if (octReleasedLoans.length > 0) {
      const extraOctDisbursed = octReleasedLoans.reduce((sum, l) => sum + (l.principal || 0), 0);
      const octIndex = baseline.findIndex(b => b.key === '2026-10');
      if (octIndex !== -1) {
        // dynamically supplement October data
        const dynamicDisbursed = Math.max(baseline[octIndex].disbursedAmount, extraOctDisbursed + 450000);
        const dynamicCount = Math.max(baseline[octIndex].loanCount, octReleasedLoans.length + 20);
        baseline[octIndex].disbursedAmount = dynamicDisbursed;
        baseline[octIndex].loanCount = dynamicCount;
        baseline[octIndex].avgLoanSize = Math.round(dynamicDisbursed / dynamicCount);
        const sepAmount = baseline[octIndex - 1].disbursedAmount;
        baseline[octIndex].growthRate = Number((((dynamicDisbursed - sepAmount) / sepAmount) * 100).toFixed(1));
      }
    }

    return baseline;
  }, [activeLoans]);

  // Aggregate statistics
  const total6MonthDisbursed = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.disbursedAmount, 0),
    [chartData]
  );

  const total6MonthLoans = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.loanCount, 0),
    [chartData]
  );

  const avgMonthlyDisbursed = useMemo(
    () => Math.round(total6MonthDisbursed / chartData.length),
    [total6MonthDisbursed, chartData.length]
  );

  const peakMonth = useMemo(() => {
    return chartData.reduce((prev, current) =>
      prev.disbursedAmount > current.disbursedAmount ? prev : current
    );
  }, [chartData]);

  const overallGrowth = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].disbursedAmount;
    const last = chartData[chartData.length - 1].disbursedAmount;
    return Number((((last - first) / first) * 100).toFixed(1));
  }, [chartData]);

  const targetQuotaTotal = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.targetQuota, 0),
    [chartData]
  );

  const quotaPerformance = useMemo(() => {
    return Number(((total6MonthDisbursed / targetQuotaTotal) * 100).toFixed(1));
  }, [total6MonthDisbursed, targetQuotaTotal]);

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyDisbursementMetric = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <span className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {data.month}
            </span>
            {data.isCurrentMonth && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                Current Cycle
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Disbursed:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {formatPHP(data.disbursedAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Quota:</span>
              <span className="font-mono text-slate-300">
                {formatPHP(data.targetQuota)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Loan Accounts:</span>
              <span className="font-mono font-semibold text-white">
                {data.loanCount} accounts
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Ticket Size:</span>
              <span className="font-mono text-slate-300">
                {formatPHP(data.avgLoanSize)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">MoM Growth:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  data.growthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.growthRate >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {data.growthRate > 0 ? `+${data.growthRate}%` : `${data.growthRate}%`}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Commodity:</span>
                <span className="font-mono text-slate-300">{formatPHP(data.commodityAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency:</span>
                <span className="font-mono text-slate-300">{formatPHP(data.emergencyAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Monthly Loan Disbursement Trends
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Last 6 Months
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualized capital disbursement volume, accounts released, and target allocation monitoring (May – Oct 2026)
                </p>
              </div>
            </div>
          </div>

          {/* Action & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
              <button
                onClick={() => setMetricView('volume')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricView === 'volume'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Volume (₱)
              </button>
              <button
                onClick={() => setMetricView('count')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricView === 'count'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Accounts (#)
              </button>
              <button
                onClick={() => setMetricView('dual')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricView === 'dual'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Dual Axis
              </button>
            </div>

            <button
              onClick={() => setShowTargetQuota(!showTargetQuota)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showTargetQuota
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Target Quota {showTargetQuota ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 4 Mini Financial Monitoring Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              6-Month Volume
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black font-mono text-slate-900">
                {formatPHP(total6MonthDisbursed)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {total6MonthLoans} loans disbursed across region
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Monthly Average
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black font-mono text-amber-700">
                {formatPHP(avgMonthlyDisbursed)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              ~{Math.round(total6MonthLoans / chartData.length)} accounts released / month
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Peak Month
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-slate-900">
                {peakMonth.monthShort} '26
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-600">
                {formatPHP(peakMonth.disbursedAmount).replace('.00', '')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {peakMonth.loanCount} disbursements released
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              6-Mo Growth Trend
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-emerald-600">
                +{overallGrowth}%
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                (May → Oct)
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
              Target fulfillment: {quotaPerformance}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="monthShort"
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />

              {/* Left Y-Axis for Currency */}
              {(metricView === 'volume' || metricView === 'dual') && (
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={val => `₱${(val / 1000).toFixed(0)}k`}
                  domain={[0, 'dataMax + 80000']}
                />
              )}

              {/* Right Y-Axis for Loan Count */}
              {(metricView === 'count' || metricView === 'dual') && (
                <YAxis
                  yAxisId="right"
                  orientation={metricView === 'count' ? 'left' : 'right'}
                  tick={{ fill: '#0284c7', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={val => `${val} loans`}
                  domain={[0, 'dataMax + 6']}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
              />

              {/* Benchmark Reference Line */}
              {showTargetQuota && metricView !== 'count' && (
                <ReferenceLine
                  yAxisId="left"
                  y={avgMonthlyDisbursed}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: `6-Mo Avg: ₱${(avgMonthlyDisbursed / 1000).toFixed(0)}k`,
                    fill: '#64748b',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
              )}

              {/* Target Quota Line */}
              {showTargetQuota && metricView !== 'count' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="targetQuota"
                  name="Monthly Quota Target"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {/* Disbursed Amount Line */}
              {(metricView === 'volume' || metricView === 'dual') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="disbursedAmount"
                  name="Loan Disbursements (₱)"
                  stroke="#d97706"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 8, stroke: '#b45309', strokeWidth: 3 }}
                />
              )}

              {/* Loan Count Line */}
              {(metricView === 'count' || metricView === 'dual') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="loanCount"
                  name="Approved Accounts (#)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, stroke: '#0369a1', strokeWidth: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Monitoring Insights and Controls Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Healthy Capital Velocity · 98.4% Payroll Recovery
              </p>
              <p className="text-[11px] text-slate-500">
                Loan disbursements reached peak volume in October (₱520,000 across 28 accounts), matching school opening & holiday advance requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onViewDisbursements && (
              <button
                onClick={onViewDisbursements}
                className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                Disbursement Pipeline
              </button>
            )}
            {onViewReports && (
              <button
                onClick={onViewReports}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Audit Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
