import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, UserPlus, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [performance, setPerformance] = useState('All');
  const [page, setPage] = useState(1);

  // Add Student Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newStudent, setNewStudent] = useState({
    student_id: '',
    student_name: '',
    gender: 'Male',
    branch: 'CSE',
    joining_year: '2024',
    current_semester: '5',
    attendance: '85',
    internal_marks: '75',
    assignment_score: '80',
    lab_performance: '80',
    previous_semester_marks: '75',
    backlog_count: '0',
    study_hours: '4',
  });

  const loadStudents = async (p = 1) => {
    setLoading(true);
    try {
      const result = await api.getStudents({
        search,
        branch,
        joining_year: year,
        semester,
        performance,
        page: p,
        page_size: 10
      });
      setData(result);
      setPage(p);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudents(1);
  }, []);

  const handleSearch = () => loadStudents(1);

  useEffect(() => {
    loadStudents(1);
  }, [branch, year, semester, performance]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setSuccessMsg('');

    if (!newStudent.student_id.trim()) {
      setAddError('Roll Number / Student ID is required.');
      return;
    }
    if (!newStudent.student_name.trim()) {
      setAddError('Student Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addStudent({
        student_id: newStudent.student_id.trim(),
        student_name: newStudent.student_name.trim(),
        gender: newStudent.gender,
        branch: newStudent.branch,
        joining_year: Number(newStudent.joining_year),
        current_semester: Number(newStudent.current_semester),
        attendance: Number(newStudent.attendance),
        internal_marks: Number(newStudent.internal_marks),
        assignment_score: Number(newStudent.assignment_score),
        lab_performance: Number(newStudent.lab_performance),
        previous_semester_marks: Number(newStudent.previous_semester_marks),
        backlog_count: Number(newStudent.backlog_count),
        study_hours: Number(newStudent.study_hours),
      });

      if (res && (res.success || res.student_id)) {
        setSuccessMsg(`Student ${newStudent.student_name} (${newStudent.student_id.toUpperCase()}) added successfully!`);
        setIsAddModalOpen(false);
        // Reset form
        setNewStudent({
          student_id: '',
          student_name: '',
          gender: 'Male',
          branch: 'CSE',
          joining_year: '2024',
          current_semester: '5',
          attendance: '85',
          internal_marks: '75',
          assignment_score: '80',
          lab_performance: '80',
          previous_semester_marks: '75',
          backlog_count: '0',
          study_hours: '4',
        });
        loadStudents(1);
      } else {
        setAddError(res.detail || res.message || 'Failed to add student');
      }
    } catch (err: any) {
      setAddError(err.message || 'Error occurred while adding student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Student Management</h2>
          <p>Search, view and manage all student records</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 500
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="card">
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

          <select className="filter-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="All">Branch: All</option>
            {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select className="filter-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="All">Joining Year: All</option>
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select className="filter-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="All">Current Sem: All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>Sem {s}</option>
            ))}
          </select>

          <select className="filter-select" value={performance} onChange={(e) => setPerformance(e.target.value)}>
            <option value="All">Performance: All</option>
            <option value="High">Excellent</option>
            <option value="Medium">Good</option>
            <option value="Low">Average</option>
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
                <th>Joining Year</th>
                <th>Current Sem</th>
                <th>CGPA</th>
                <th>Performance</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.students?.map((s: any) => {
                const cgpaVal = s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—';

                const perfText = s.performance === 'High'
                  ? 'Excellent'
                  : (s.performance === 'Low' ? 'Average' : 'Good');

                const isRisk = s.risk === 'At-Risk' || s.risk === 'High Risk';
                const riskBadgeClass = isRisk ? 'badge-at-risk' : 'badge-pass';
                const riskText = isRisk ? 'At Risk' : 'On Track';

                const currentSem = s.current_semester || s.semester || '-';

                return (
                  <tr key={s.student_id + s.sno}>
                    <td>{s.sno}</td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{s.student_id}</td>
                    <td>{s.student_name}</td>
                    <td>{s.branch}</td>
                    <td>{s.joining_year}</td>
                    <td>
                      <span className="badge badge-primary" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        Sem {currentSem}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{cgpaVal}</td>
                    <td>
                      <span className={`badge badge-${s.performance ? s.performance.toLowerCase() : 'medium'}`}>
                        {perfText}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${riskBadgeClass}`}>
                        {riskText}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/students/${s.student_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40 }}>
                    Loading student records...
                  </td>
                </tr>
              )}

              {!loading && !data?.students?.length && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} records
            </div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => loadStudents(page - 1)}>«</button>
              {Array.from({ length: Math.min(data.total_pages, 5) }, (_, i) => {
                let p = i + 1;
                if (data.total_pages > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > data.total_pages) p = data.total_pages - (4 - i);
                }
                return (
                  <button
                    key={p}
                    className={page === p ? 'active' : ''}
                    onClick={() => loadStudents(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={page >= data.total_pages} onClick={() => loadStudents(page + 1)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%',
            maxWidth: 640,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Add New Student</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Enter new student academic details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Roll Number / Student ID *</label>
                  <input
                    type="text"
                    name="student_id"
                    value={newStudent.student_id}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. 24B11CS999"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="student_name"
                    value={newStudent.student_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  <select name="gender" value={newStudent.gender} onChange={handleInputChange} className="form-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Branch</label>
                  <select name="branch" value={newStudent.branch} onChange={handleInputChange} className="form-select">
                    {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Joining Year</label>
                  <select name="joining_year" value={newStudent.joining_year} onChange={handleInputChange} className="form-select">
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Current Semester</label>
                  <select name="current_semester" value={newStudent.current_semester} onChange={handleInputChange} className="form-select">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={String(s)}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Attendance (%)</label>
                  <input
                    type="number"
                    name="attendance"
                    value={newStudent.attendance}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Previous Marks (%)</label>
                  <input
                    type="number"
                    name="previous_semester_marks"
                    value={newStudent.previous_semester_marks}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Internal Marks (Avg)</label>
                  <input
                    type="number"
                    name="internal_marks"
                    value={newStudent.internal_marks}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Assignment Score</label>
                  <input
                    type="number"
                    name="assignment_score"
                    value={newStudent.assignment_score}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Lab Performance</label>
                  <input
                    type="number"
                    name="lab_performance"
                    value={newStudent.lab_performance}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Backlog Count</label>
                  <input
                    type="number"
                    name="backlog_count"
                    value={newStudent.backlog_count}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Study Hours Per Day</label>
                  <input
                    type="number"
                    name="study_hours"
                    value={newStudent.study_hours}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving Student...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
