import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Monitor, AlertTriangle, BookOpen, GraduationCap, Building2, Search } from 'lucide-react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  ScatterChart, Scatter,
} from 'recharts';

const BRANCH_COLORS: Record<string, string> = {
  CSE: '#3b82f6', DS: '#10b981', ECE: '#f59e0b', AI: '#ef4444',
  IT: '#8b5cf6', EEE: '#ec4899', MECH: '#06b6d4', CIVIL: '#84cc16',
};

const PERF_COLORS: Record<string, string> = {
  High: '#10b981', Medium: '#f59e0b', Low: '#ef4444',
};

const YEAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendStudentId, setTrendStudentId] = useState('');

  useEffect(() => {
    loadDashboard();
    loadStudents();
  }, []);

  const loadDashboard = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadStudents = async (s?: string, b?: string, y?: string, sem?: string) => {
    try {
      const result = await api.getStudents({
        search: s || search,
        branch: b || filterBranch,
        joining_year: y || filterYear,
        semester: sem || filterSemester,
        page: 1, page_size: 8,
      });
      setStudents(result);
    } catch (e) { console.error(e); }
  };

  const handleSearch = () => {
    loadStudents(search, filterBranch, filterYear, filterSemester);
  };

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'branch') { setFilterBranch(value); loadStudents(search, value, filterYear, filterSemester); }
    if (type === 'year') { setFilterYear(value); loadStudents(search, filterBranch, value, filterSemester); }
    if (type === 'semester') { setFilterSemester(value); loadStudents(search, filterBranch, filterYear, value); }
  };

  const loadTrend = async (studentId: string) => {
    if (!studentId) return;
    try {
      const trend = await api.getStudentTrend(studentId);
      setTrendData(trend);
      setTrendStudentId(studentId);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (students?.students?.[0]) {
      loadTrend(students.students[0].student_id);
    }
  }, [students]);

  if (loading || !data) {
    return <div className="loading-spinner"><div className="spinner" /> Loading dashboard...</div>;
  }

  // Prepare chart data
  const branchData = Object.entries(data.branch_counts).map(([name, value]) => ({
    name, value: value as number, fill: BRANCH_COLORS[name] || '#94a3b8',
  }));

  const yearData = Object.entries(data.year_counts).map(([name, value], i) => ({
    name, value: value as number, fill: YEAR_COLORS[i % YEAR_COLORS.length],
  }));

  const perfData = Object.entries(data.performance_distribution).map(([name, value]) => ({
    name, value: value as number, fill: PERF_COLORS[name] || '#94a3b8',
  }));
  const perfTotal = perfData.reduce((s, d) => s + d.value, 0);

  const riskData = Object.entries(data.branch_risk).map(([name, val]: [string, any]) => ({
    name, 'On Track': val.pass, 'At Risk': val.at_risk,
  }));

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} /></div>
          <div className="stat-info"><h3>{data.total_students}</h3><p>Total Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Monitor size={22} /></div>
          <div className="stat-info"><h3>{data.cse_students}</h3><p>CSE Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Monitor size={22} /></div>
          <div className="stat-info"><h3>{data.ds_students}</h3><p>DS Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Monitor size={22} /></div>
          <div className="stat-info"><h3>{data.ece_students}</h3><p>ECE Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Monitor size={22} /></div>
          <div className="stat-info"><h3>{data.ai_students}</h3><p>AI Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Building2 size={22} /></div>
          <div className="stat-info"><h3>{data.other_branches}</h3><p>Other Branches</p></div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-charts-row">
        {/* Students by Branch */}
        <div className="card">
          <div className="card-header"><span className="card-title">Students by Branch</span></div>
          <div className="chart-container-sm">
            <ResponsiveContainer>
              <BarChart data={branchData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {branchData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by Joining Year - Donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Students by Joining Year</span></div>
          <div className="chart-container-sm">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={yearData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {yearData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                <Legend
                  formatter={(value: string) => {
                    const item = yearData.find(d => d.name === value);
                    return `${value} (${item?.value || 0})`;
                  }}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Distribution - Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Performance Distribution</span></div>
          <div className="chart-container-sm">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={perfData}
                  cx="50%" cy="50%"
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {perfData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} (${perfTotal > 0 ? ((value / perfTotal) * 100).toFixed(0) : 0}%)`, name]} />
                <Legend
                  formatter={(value: string) => {
                    const item = perfData.find(d => d.name === value);
                    return `${value} (${perfTotal > 0 && item ? ((item.value / perfTotal) * 100).toFixed(0) : 0}%)`;
                  }}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Details Table + Prediction Panel */}
      <div className="dashboard-middle-row">
        {/* Student Details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Student Details</span>
          </div>

          <div className="filters-bar">
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input
                className="search-input"
                placeholder="Search by Roll Number, Name or Branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select className="filter-select" value={filterBranch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
              <option value="All">All Branches</option>
              {['CSE','DS','ECE','AI','IT','EEE','MECH','CIVIL'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-select" value={filterYear} onChange={(e) => handleFilterChange('year', e.target.value)}>
              <option value="All">All Years</option>
              {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="filter-select" value={filterSemester} onChange={(e) => handleFilterChange('semester', e.target.value)}>
              <option value="All">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Sem</th>
                  <th>Status</th>
                  <th>Performance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students?.students?.map((s: any) => (
                   <tr key={s.student_id}>
                    <td>{s.sno}</td>
                    <td style={{ fontWeight: 600 }}>{s.student_id}</td>
                    <td>{s.student_name}</td>
                    <td>{s.branch}</td>
                    <td>{s.joining_year}</td>
                    <td>{s.semester}</td>
                    <td><span className={`badge ${s.risk === 'At-Risk' ? 'badge-at-risk' : 'badge-pass'}`}>{s.risk === 'At-Risk' ? 'At Risk' : 'On Track'}</span></td>
                    <td><span className={`badge badge-${(s.performance || 'medium').toLowerCase()}`}>{s.performance}</span></td>
                    <td><button className="btn-view" onClick={() => navigate(`/students/${s.student_id}`)}>View</button></td>
                   </tr>
                  ))}
                {!students?.students?.length && (
                  <tr><td colSpan={9} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Prediction Panel */}
        <div className="card">
          <div className="card-header"><span className="card-title">Performance Prediction</span></div>
          <QuickPrediction />
        </div>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid-dashboard-bottom">
        {/* Performance Trend */}
        <div className="card">
          <div className="card-header"><span className="card-title">Performance Trend {trendStudentId ? `(${trendStudentId})` : '(Sample Student)'}</span></div>
          <div className="chart-container-sm">
            <ResponsiveContainer>
              <LineChart data={trendData.length ? trendData : []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}${v === 1 ? 'st' : v === 2 ? 'nd' : v === 3 ? 'rd' : 'th'}`} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="internal_marks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Marks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance vs Performance */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attendance vs Performance</span></div>
          <div className="chart-container-sm">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="attendance" name="Attendance" unit="%" tick={{ fontSize: 11 }} domain={[40, 100]} />
                <YAxis dataKey="marks" name="Marks" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data.scatter_data} fill="#3b82f6" fillOpacity={0.6} r={3} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Quick Prediction Form - inline component */
function QuickPrediction() {
  const [form, setForm] = useState({
    student_id: '', branch: 'CSE', joining_year: 2024, semester: 5,
    attendance: '', previous_semester_marks: '', internal_marks: '',
    assignment_score: '', lab_performance: '', backlog_count: 0, study_hours: '',
    previous_performance: '',
  });
  const [foundStudentName, setFoundStudentName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = form.student_id.trim();
      if (!trimmed) {
        setFoundStudentName('');
        return;
      }
      try {
        const s = await api.getStudent(trimmed);
        if (s && s.student_id) {
          setFoundStudentName(`${s.student_name} (${s.gender})`);
          setForm(prev => ({
            ...prev,
            branch: s.branch || prev.branch,
            joining_year: s.joining_year || prev.joining_year,
            semester: s.current_semester || prev.semester,
            attendance: String(s.attendance ?? prev.attendance),
            previous_semester_marks: String(s.previous_semester_marks ?? prev.previous_semester_marks),
            internal_marks: String(s.internal_marks ?? prev.internal_marks),
            assignment_score: String(s.assignment_score ?? prev.assignment_score),
            lab_performance: String(s.lab_performance ?? prev.lab_performance),
            backlog_count: s.backlog_count ?? prev.backlog_count,
            study_hours: String(s.study_hours ?? prev.study_hours),
          }));
        } else {
          setFoundStudentName('');
        }
      } catch (e) {
        setFoundStudentName('');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form.student_id]);

  const handlePredict = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.predict({
        ...form,
        attendance: parseFloat(form.attendance as string) || 75,
        previous_semester_marks: parseFloat(form.previous_semester_marks as string) || 60,
        internal_marks: parseFloat(form.internal_marks as string) || 60,
        assignment_score: parseFloat(form.assignment_score as string) || 70,
        lab_performance: parseFloat(form.lab_performance as string) || 70,
        study_hours: parseFloat(form.study_hours as string) || 4,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Prediction failed');
    }
    setLoading(false);
  };

  return (
    <div>
      {foundStudentName && (
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 8, padding: '4px 8px', background: '#f0fdf4', borderRadius: 6 }}>
          ✓ Student Loaded: {foundStudentName}
        </div>
      )}
      <div className="prediction-form">
        <div className="form-group">
          <label className="form-label">Roll Number</label>
          <input className="form-input" placeholder="e.g. 24B11CS001" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Branch</label>
          <select className="form-select" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            {['CSE','DS','ECE','AI','IT','EEE','MECH','CIVIL'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Joining Year</label>
          <select className="form-select" value={form.joining_year} onChange={(e) => setForm({ ...form, joining_year: +e.target.value })}>
            {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Current Semester</label>
          <input className="form-input" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: +e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Attendance (%)</label>
          <input className="form-input" placeholder="e.g. 85" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Prev Sem Marks</label>
          <input className="form-input" placeholder="e.g. 78" value={form.previous_semester_marks} onChange={(e) => setForm({ ...form, previous_semester_marks: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Internal Marks</label>
          <input className="form-input" placeholder="e.g. 75" value={form.internal_marks} onChange={(e) => setForm({ ...form, internal_marks: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Assignment Score</label>
          <input className="form-input" placeholder="e.g. 80" value={form.assignment_score} onChange={(e) => setForm({ ...form, assignment_score: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Lab Performance</label>
          <input className="form-input" placeholder="e.g. 85" value={form.lab_performance} onChange={(e) => setForm({ ...form, lab_performance: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Backlogs</label>
          <select className="form-select" value={form.backlog_count} onChange={(e) => setForm({ ...form, backlog_count: +e.target.value })}>
            {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'None' : n}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Study Hours/Day</label>
          <input className="form-input" placeholder="e.g. 5" value={form.study_hours} onChange={(e) => setForm({ ...form, study_hours: e.target.value })} />
        </div>
        <div className="predict-button">
          <button className="btn btn-primary btn-block" onClick={handlePredict} disabled={loading}>
            {loading ? '⏳ Predicting...' : '🔮 Predict Performance'}
          </button>
        </div>
      </div>

      {error && <div className="login-error mt-3">{error}</div>}

      {result && (
        <div className={`prediction-result ${result.performance.toLowerCase()}`}>
          <div className="result-header"><h3>Prediction Result</h3></div>
          <div className="result-grid">
            <div className="result-item">
              <div className="label">Performance</div>
              <div className="value" style={{ color: PERF_COLORS[result.performance] || '#333' }}>{result.performance.toUpperCase()}</div>
            </div>
            <div className="result-item">
              <div className="label">Risk Level</div>
              <div className="value" style={{ color: result.risk_level === 'At-Risk' ? '#ef4444' : '#10b981' }}>{result.risk_description}</div>
            </div>
            <div className="result-item">
              <div className="label">Probability</div>
              <div className="value" style={{ color: '#3b82f6' }}>{result.probability}%</div>
            </div>
          </div>
          <div className="result-factors">
            <h4>Key Factors</h4>
            {result.top_factors?.slice(0, 4).map((f: any, i: number) => (
              <div className="factor-bar" key={i}>
                <span className="factor-name">{f.feature}</span>
                <div className="factor-track"><div className="factor-fill" style={{ width: `${f.importance}%` }} /></div>
                <span className="factor-value">{f.importance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
