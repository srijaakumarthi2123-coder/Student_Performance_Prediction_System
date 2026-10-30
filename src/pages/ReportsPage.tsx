import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, BarChart2, AlertTriangle, Search, Download, FileText } from 'lucide-react';
import { api } from '../services/api';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

const YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('Overall Report');
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadReportData = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        branch: branch === 'All' ? '' : branch,
        joining_year: year === 'All' ? '' : year,
        semester: semester === 'All' ? '' : semester,
      };

      const [overallRes, branchRes, riskRes, analyticsRes] = await Promise.all([
        api.getOverallReport(),
        api.getBranchReport(branch === 'All' ? '' : branch),
        api.getAtRiskReport(),
        api.getAnalytics(params),
      ]);

      // Branch-wise stacked bar chart data
      const branchPerf = Object.entries(analyticsRes.branch_performance || {}).map(([br, val]: [string, any]) => ({
        branch: br,
        High: val.high || 0,
        Medium: val.medium || 0,
        Low: val.low || 0,
      }));

      // Year-wise donut
      const yearAnalysis = Object.entries(analyticsRes.year_performance || {}).map(([yr, val]: [string, any]) => ({
        name: `${yr} (${val.total})`,
        value: val.total,
      }));

      // Semester stacked bar
      const semPerf = Object.entries(analyticsRes.semester_performance || {})
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sem, val]: [string, any]) => ({
          sem: `Sem ${sem}`,
          High: val.high || 0,
          Medium: val.medium || 0,
          Low: val.low || 0,
        }));

      // Students table - use at-risk report students + top students
      const perfDist = overallRes.performance_distribution || {};
      const riskDist = overallRes.risk_distribution || {};
      const totalStudents = overallRes.total_students || 0;
      const highCount = perfDist['High'] || 0;
      const medCount = perfDist['Medium'] || 0;
      const atRiskCount = riskDist['At-Risk'] || 0;

      const highPct = totalStudents > 0 ? Math.round((highCount / totalStudents) * 100) : 0;
      const medPct = totalStudents > 0 ? Math.round((medCount / totalStudents) * 100) : 0;
      const riskPct = totalStudents > 0 ? Math.round((atRiskCount / totalStudents) * 100) : 0;

      // Report detail table - use risk students
      const allStudents = riskRes.students || [];

      setData({
        total_students: totalStudents,
        high_performers: `${highCount} (${highPct}%)`,
        avg_performers: `${medCount} (${medPct}%)`,
        at_risk: `${atRiskCount} (${riskPct}%)`,
        branchPerf,
        yearAnalysis,
        semPerf,
        students: allStudents,
        averages: overallRes.averages || {},
      });
      setPage(p);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load report data. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(1);
  }, []);

  const handleExportCSV = () => {
    api.exportReport('all', {
      branch: branch === 'All' ? '' : branch,
      joining_year: year === 'All' ? '' : year,
      semester: semester === 'All' ? '' : semester,
    });
  };

  const handleExportAtRisk = () => {
    api.exportReport('at-risk', {});
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Filter students by search
  const filteredStudents = (data?.students || []).filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(s.student_id || '').toLowerCase().includes(q) ||
      String(s.student_name || '').toLowerCase().includes(q) ||
      String(s.branch || '').toLowerCase().includes(q)
    );
  });

  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generate and export student performance reports</p>
      </div>

      {/* Top Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 2 }}>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="filter-select">
              <option value="Overall Report">Overall Report</option>
              <option value="Branch-wise Report">Branch-wise Report</option>
              <option value="Joining Year Report">Joining Year Report</option>
              <option value="Semester Report">Semester Report</option>
              <option value="At-Risk Student Report">At-Risk Student Report</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 2 }}>Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="filter-select">
              <option value="All">All Branches</option>
              {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 2 }}>Joining Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="filter-select">
              <option value="All">All Years</option>
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 2 }}>Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="filter-select">
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={String(s)}>Sem {s}</option>
              ))}
            </select>
          </div>

          <button onClick={() => loadReportData(1)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={16} /> Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="stat-cards" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{data?.total_students?.toLocaleString() ?? '—'}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h3>{data?.high_performers ?? '—'}</h3>
            <p>High Performers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow"><BarChart2 size={24} /></div>
          <div className="stat-info">
            <h3>{data?.avg_performers ?? '—'}</h3>
            <p>Average Performers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <h3>{data?.at_risk ?? '—'}</h3>
            <p>At-Risk Students</p>
          </div>
        </div>
      </div>

      {/* 3 Charts Grid */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {/* 1. Branch-wise Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Branch-wise Performance</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.branchPerf}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="High" fill="#10b981" stackId="a" />
                  <Bar dataKey="Medium" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Low" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Joining Year Analysis */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Joining Year Analysis</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.yearAnalysis}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                  >
                    {(data.yearAnalysis || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={YEAR_COLORS[idx % YEAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Semester-wise Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Semester-wise Performance</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.semPerf}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="sem" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="High" fill="#10b981" stackId="a" />
                  <Bar dataKey="Medium" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Low" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">
            Report Details {reportType === 'At-Risk Student Report' ? '— At-Risk Students' : '— All Students'}
          </h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExportCSV} className="btn btn-success btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Download size={14} /> Export All CSV
            </button>
            <button onClick={handleExportAtRisk} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={14} /> Export At-Risk CSV
            </button>
            <button onClick={handleExportPDF} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={14} /> Export PDF
            </button>
          </div>
        </div>

        <div className="filters-bar" style={{ marginBottom: 16 }}>
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search by Roll Number, Name, or Branch..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Attendance %</th>
                <th>Backlogs</th>
                <th>Performance</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Loading report data...</td>
                </tr>
              )}
              {!loading && paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    {search ? 'No records match the search.' : 'No at-risk students found. All students are on track! 🎉'}
                  </td>
                </tr>
              )}
              {!loading && paginatedStudents.map((s: any, idx: number) => {
                const sno = (page - 1) * PAGE_SIZE + idx + 1;
                const isAtRisk = s.risk === 'At-Risk';
                return (
                  <tr key={s.student_id + idx}>
                    <td>{sno}</td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{s.student_id}</td>
                    <td>{s.student_name}</td>
                    <td>{s.branch}</td>
                    <td>Sem {s.semester}</td>
                    <td>{s.attendance != null ? `${s.attendance}%` : '—'}</td>
                    <td>{s.backlogs ?? 0}</td>
                    <td>
                      <span className={`badge badge-${(s.performance || 'medium').toLowerCase()}`}>
                        {s.performance || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isAtRisk ? 'badge-at-risk' : 'badge-pass'}`}>
                        {isAtRisk ? 'At Risk' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} records
            </div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>«</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                }
                return (
                  <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
