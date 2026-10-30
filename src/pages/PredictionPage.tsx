import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Sparkles, Lightbulb, BarChart2, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    roll_number: '23B11CS001',
    branch: 'CSE',
    joining_year: '2023',
    current_semester: '7',
    attendance: '85',
    previous_cgpa: '7.8',
    internal_marks: '78',
    assignment_score: '82',
    lab_performance: '88',
    backlogs: '0',
    study_hours: '4',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);

  // Load student roll numbers list for autocomplete datalist
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.getStudents({ page: 1, page_size: 100 });
        if (res && res.students) {
          setStudentList(res.students);
        }
      } catch (err) {
        console.error('Failed to load student list for autocomplete', err);
      }
    };
    fetchStudents();
  }, []);

  // Automatic lookup when roll number changes
  const fetchStudentDetails = useCallback(async (rollNo: string) => {
    const trimmed = rollNo.trim();
    if (!trimmed) {
      setFoundStudent(null);
      return;
    }

    setSearching(true);
    try {
      const student = await api.getStudent(trimmed);
      if (student && student.student_id) {
        setFoundStudent(student);
        const prevCgpa = student.cgpa != null 
          ? Number(student.cgpa).toFixed(1)
          : (student.previous_semester_marks != null ? (student.previous_semester_marks / 10).toFixed(1) : '7.5');

        setFormData((prev) => ({
          ...prev,
          roll_number: student.student_id,
          branch: student.branch || prev.branch,
          joining_year: String(student.joining_year || prev.joining_year),
          current_semester: String(student.current_semester || prev.current_semester),
          attendance: String(student.attendance ?? prev.attendance),
          previous_cgpa: String(prevCgpa),
          internal_marks: String(student.internal_marks ?? prev.internal_marks),
          assignment_score: String(student.assignment_score ?? prev.assignment_score),
          lab_performance: String(student.lab_performance ?? prev.lab_performance),
          backlogs: String(student.backlog_count ?? prev.backlogs),
          study_hours: String(student.study_hours ?? prev.study_hours),
        }));
      } else {
        setFoundStudent(null);
      }
    } catch (e) {
      setFoundStudent(null);
    } finally {
      setSearching(false);
    }
  }, []);

  // Trigger search whenever roll_number input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentDetails(formData.roll_number);
    }, 250);
    return () => clearTimeout(timer);
  }, [formData.roll_number, fetchStudentDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predict({
        student_id: formData.roll_number,
        branch: formData.branch,
        attendance: Number(formData.attendance),
        internal_marks: Number(formData.internal_marks),
        assignment_score: Number(formData.assignment_score),
        lab_performance: Number(formData.lab_performance),
        previous_semester_marks: Number(formData.previous_cgpa) * 10,
        backlog_count: Number(formData.backlogs),
        study_hours: Number(formData.study_hours),
        semester: Number(formData.current_semester),
        joining_year: Number(formData.joining_year),
      });

      setResult({
        predicted_performance: res.performance === 'High' ? 'Excellent' : (res.performance === 'Low' ? 'Average' : 'Good'),
        probability: res.probability || 87,
        risk_level: res.risk_description || 'Low',
        category: res.performance || 'High',
        factors: res.top_factors ? res.top_factors.map((f: any) => ({ name: f.feature, val: f.importance })) : [
          { name: 'Attendance', val: 85 },
          { name: 'Previous Performance', val: 78 },
          { name: 'Internal Marks', val: 72 },
          { name: 'Assignment Score', val: 68 },
          { name: 'Lab Performance', val: 65 },
        ],
        recommendation: res.performance === 'High'
          ? 'The student is on track for outstanding academic results. Encourage participation in advanced projects.'
          : res.performance === 'Low'
          ? 'Special academic attention and tutoring recommended. Focus on improving attendance and internal marks.'
          : 'Consistent performance observed. Regular monitoring will help sustain and improve current standing.',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Performance Prediction</h2>
        <p>Enter or select a student roll number to automatically retrieve student details and run performance prediction.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left Form Panel */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Student Details (Input)</h3>
            {searching && <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>Fetching student details...</span>}
          </div>

          {/* Automatic Student Found Banner */}
          {foundStudent && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#16a34a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0
              }}>
                {foundStudent.student_name ? foundStudent.student_name[0] : 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#14532d', fontSize: 14 }}>
                    {foundStudent.student_name}
                  </span>
                  <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                  <span className="badge badge-pass" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {foundStudent.gender}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                  Roll No: <strong>{foundStudent.student_id}</strong> • Branch: <strong>{foundStudent.branch}</strong> • Batch: <strong>{foundStudent.joining_year}</strong> • Sem: <strong>{foundStudent.current_semester}</strong>
                </div>
              </div>
            </div>
          )}

          {!foundStudent && formData.roll_number.trim() && !searching && (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 16,
              fontSize: 12,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <AlertCircle size={14} style={{ color: '#94a3b8' }} />
              <span>Enter roll number to auto-populate existing student record, or enter parameters manually.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label">Roll Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Type or select roll number..."
                    list="student-roll-list"
                    autoComplete="off"
                  />
                  <datalist id="student-roll-list">
                    {studentList.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.student_name} ({s.branch})
                      </option>
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => fetchStudentDetails(formData.roll_number)}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      border: 'none', background: 'none', cursor: 'pointer', color: '#64748b'
                    }}
                    title="Search Roll Number"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange} className="form-select">
                  {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Joining Year</label>
                <select name="joining_year" value={formData.joining_year} onChange={handleChange} className="form-select">
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Current Semester</label>
                <select name="current_semester" value={formData.current_semester} onChange={handleChange} className="form-select">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Attendance (%)</label>
                <input type="number" name="attendance" value={formData.attendance} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="form-label">Previous CGPA / Marks</label>
                <input type="number" step="0.1" name="previous_cgpa" value={formData.previous_cgpa} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="form-label">Internal Marks (Avg)</label>
                <input type="number" name="internal_marks" value={formData.internal_marks} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="form-label">Assignment Score</label>
                <input type="number" name="assignment_score" value={formData.assignment_score} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="form-label">Lab Performance</label>
                <input type="number" name="lab_performance" value={formData.lab_performance} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="form-label">Backlog Count</label>
                <input type="number" name="backlogs" value={formData.backlogs} onChange={handleChange} className="form-input" />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Study Hours Per Day</label>
                <input type="number" name="study_hours" value={formData.study_hours} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 20 }}>
              <BarChart2 size={18} /> {loading ? 'Predicting...' : 'Predict Performance'}
            </button>
          </form>
        </div>

        {/* Right Prediction Results Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Prediction Result</h3>
          </div>

          {result ? (
            <div>
              {/* Outcome Header Box */}
              <div style={{
                background: '#ecfdf5', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20,
                border: '1px solid #a7f3d0'
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', background: '#10b981', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 24
                }}>
                  <TrendingUp size={28} />
                </div>
                <div style={{ fontSize: 12, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Predicted Performance</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46', marginTop: 2 }}>{result.predicted_performance}</div>
              </div>

              {/* Metric Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Prediction Probability</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{result.probability}%</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Risk Level</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge badge-${result.risk_level.toLowerCase() === 'high' ? 'at-risk' : 'pass'}`}>
                      {result.risk_level}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Performance Category</div>
                  <div style={{ marginTop: 4 }}>
                    <span className="badge badge-high">{result.category}</span>
                  </div>
                </div>
              </div>

              {/* Key Factors Progress Bars */}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Key Factors Affecting Prediction</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {result.factors.map((f: any, idx: number) => (
                  <div key={f.name || idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{f.name}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{f.val}%</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, f.val)}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Note Box */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 14, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Lightbulb size={20} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#064e3b', lineHeight: 1.4 }}>
                  {result.recommendation}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <Sparkles size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p>Enter or pick a student roll number above to auto-load student data, then click <strong>Predict Performance</strong>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
