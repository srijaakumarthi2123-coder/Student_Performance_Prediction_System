import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, ScatterChart, Scatter
} from 'recharts';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [semester, setSemester] = useState('All');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        branch: branch === 'All' ? '' : branch,
        joining_year: year === 'All' ? '' : year,
        semester: semester === 'All' ? '' : semester,
      };
      const [res, riskRes] = await Promise.all([
        api.getAnalytics(params),
        api.getRiskAnalysis(params),
      ]);

      // Branch-wise chart from real data
      const branchData = Object.entries(res.branch_performance || {}).map(([br, val]: [string, any]) => ({
        branch: br,
        cgpa: val.avg_cgpa != null ? parseFloat(Number(val.avg_cgpa).toFixed(2)) : (val.avg_internal ? parseFloat((val.avg_internal / 10).toFixed(2)) : 0),
        onTrack: val.total - val.at_risk,
        atRisk: val.at_risk,
        High: val.high,
        Medium: val.medium,
        Low: val.low,
      }));

      // Year-wise pie chart
      const yearData = Object.entries(res.year_performance || {}).map(([yr, val]: [string, any]) => ({
        name: `${yr} (${val.total})`,
        value: val.total,
      }));

      // Performance distribution pie
      const perfDist = Object.entries(res.performance_distribution || {}).map(([name, value]: [string, any]) => ({
        name: `${name === 'High' ? 'Excellent' : name === 'Low' ? 'Average' : name} (${Math.round((value / res.total_students) * 100)}%)`,
        value: value as number,
      }));

      // Semester trend from real data
      const semTrend = Object.entries(res.semester_performance || {})
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sem, val]: [string, any]) => ({
          sem: `Sem ${sem}`,
          gpa: val.avg_internal ? parseFloat((val.avg_internal / 10).toFixed(2)) : 0,
          attendance: val.avg_attendance,
        }));

      // Scatter data derived from branch data (attendance vs avg marks)
      const scatterData = branchData.map((b) => ({
        attendance: parseFloat(
          (res.branch_performance[b.branch]?.avg_attendance || 70).toFixed(1)
        ),
        cgpa: b.cgpa,
        branch: b.branch,
      }));

      // Stats
      const avgAttendance = branchData.length
        ? parseFloat((branchData.reduce((s, b) => s + (res.branch_performance[b.branch]?.avg_attendance || 0), 0) / branchData.length).toFixed(1))
        : 0;
      const avgCgpa = branchData.length
        ? parseFloat((branchData.reduce((s, b) => s + b.cgpa, 0) / branchData.length).toFixed(2))
        : 0;
      const atRiskPct = res.total_students > 0
        ? Math.round(((res.risk_distribution?.['At-Risk'] || 0) / res.total_students) * 100)
        : 0;

      setData({
        avg_cgpa: avgCgpa,
        avg_attendance: avgAttendance,
        at_risk_pct: atRiskPct,
        total_students: res.total_students,
        branchData,
        yearData,
        perfDist,
        semTrend,
        scatterData,
      });
    } catch (err: any) {
      console.error(err);
      setError('Failed to load analytics data. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [branch, year, semester]);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>View Analytics</h2>
          <p>Analyze student performance with interactive visualizations</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="filter-select">
            <option value="All">Branch: All</option>
            {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select value={year} onChange={(e) => setYear(e.target.value)} className="filter-select">
            <option value="All">Joining Year: All</option>
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="filter-select">
            <option value="All">Semester: All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>Sem {s}</option>
            ))}
          </select>

          <button onClick={loadAnalytics} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !data && (
        <div className="loading-spinner"><div className="spinner" /> Loading analytics...</div>
      )}

      {/* 4 Stat Cards Row */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue"><GraduationCap size={24} /></div>
          <div className="stat-info">
            <h3>{data?.avg_cgpa ?? '—'}</h3>
            <p>Average CGPA</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{data?.avg_attendance != null ? `${data.avg_attendance}%` : '—'}</h3>
            <p>Average Attendance</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <h3>{data?.at_risk_pct != null ? `${data.at_risk_pct}%` : '—'}</h3>
            <p>At-Risk Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{data?.total_students ?? '—'}</h3>
            <p>Total Students</p>
          </div>
        </div>
      </div>

      {/* 6 Charts Grid */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* 1. Branch-wise Performance (Avg CGPA) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Branch-wise Performance (Avg CGPA)</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.branchData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="cgpa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Students by Joining Year */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Students by Joining Year</h3>
            </div>
            <div style={{ height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.yearData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                  >
                    {(data.yearData || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={YEAR_COLORS[idx % YEAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Performance Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Performance Distribution</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.perfDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                  >
                    {(data.perfDist || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Semester Performance Trend */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Semester Performance Trend</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.semTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="sem" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[5, 10]} stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="gpa" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Avg CGPA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Attendance vs Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Attendance vs Performance</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" stroke="#64748b" fontSize={11} domain={[40, 100]} />
                  <YAxis type="number" dataKey="cgpa" name="CGPA" stroke="#64748b" fontSize={11} domain={[0, 10]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={data.scatterData} fill="#3b82f6" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Risk Analysis by Branch */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Risk Analysis by Branch</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.branchData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTrack" name="On Track" stackId="a" fill="#10b981" />
                  <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
