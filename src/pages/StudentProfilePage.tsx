import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Clock, Award, BookOpen, AlertTriangle, Activity } from 'lucide-react';
import { api } from '../services/api';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getStudent(id)
      .then((sData) => {
        setStudent(sData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
        Loading student profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2>Student not found</h2>
        <button
          onClick={() => navigate('/students')}
          className="btn btn-primary"
          style={{ marginTop: 16 }}
        >
          Back to Students
        </button>
      </div>
    );
  }

  const cgpa = student.cgpa != null ? Number(student.cgpa).toFixed(2) : '-';
  const perfText = student.current_performance === 'High' || student.performance === 'High' ? 'Excellent' : (student.current_performance === 'Low' || student.performance === 'Low' ? 'Average' : 'Good');
  const riskText = student.pass_at_risk === 'At-Risk' || student.risk === 'At-Risk' ? 'At Risk' : 'On Track';

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Student Profile</h2>
          <p>View detailed information and academic history</p>
        </div>
        <button
          onClick={() => navigate('/students')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Back to Students
        </button>
      </div>

      {/* Main Profile Header Banner Card */}
      <div className="card" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar Icon */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#dbeafe',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            flexShrink: 0
          }}>
            <User size={40} />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {student.student_name}
              </h2>
              <span className={`badge badge-${student.semester_status?.toLowerCase() || 'current'}`}>
                {student.semester_status || 'Current'}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600, margin: 0 }}>
              {student.student_id}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 20, flex: 2 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Branch</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.branch}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Joining Year</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.joining_year}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Gender</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.gender || 'Female'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Age</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.age || 20}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Current Semester</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.current_semester || student.semester}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>CGPA</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{cgpa}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Performance</div>
              <div><span className="badge badge-high">{perfText}</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Risk Level</div>
              <div><span className="badge badge-pass">{riskText}</span></div>
            </div>
          </div>
        </div>

        {/* 6 Mini Metrics Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 24 }}>
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={24} style={{ color: '#2563eb' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Attendance</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a' }}>{student.attendance || 85}%</div>
            </div>
          </div>

          <div style={{ background: '#fef2f2', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} style={{ color: '#ef4444' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Internal Marks</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#991b1b' }}>{student.internal_marks || 78}</div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={24} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Assignment Score</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e40af' }}>{student.assignment_score || 82}</div>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={24} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Lab Performance</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#065f46' }}>{student.lab_performance || 88}</div>
            </div>
          </div>

          <div style={{ background: '#fefce8', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={24} style={{ color: '#eab308' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Backlogs</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#854d0e' }}>{student.backlog_count ?? 0}</div>
            </div>
          </div>

          <div style={{ background: '#faf5ff', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} style={{ color: '#a855f7' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Study Hours/Day</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#6b21a8' }}>{student.study_hours || 4} hrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Personal Info & Semester History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Personal Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
          </div>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Roll Number</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.student_id}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Student Name</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.student_name}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Branch</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.branch}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Joining Year</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.joining_year}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Gender</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.gender || 'Female'}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Age</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.age || 20}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Current Semester</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.current_semester || student.semester}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', fontWeight: 500, padding: '10px 0' }}>Semester Status</td>
                <td style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>: {student.semester_status || 'Current'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Semester History Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Semester History</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>CGPA</th>
                  <th>Performance</th>
                  <th>Attendance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(student.semester_history || []).map((sem: any) => {
                  const isUpcoming = sem.status === 'Upcoming';
                  const semCgpa = isUpcoming ? '-' : (sem.cgpa != null ? Number(sem.cgpa).toFixed(2) : '-');
                  const semPerf = isUpcoming ? '-' : (sem.performance === 'High' ? 'Excellent' : (sem.performance === 'Low' ? 'Average' : 'Good'));
                  const semAtt = isUpcoming ? '-' : `${sem.attendance || 85}%`;

                  return (
                    <tr key={sem.semester}>
                      <td style={{ fontWeight: 600 }}>{sem.semester}</td>
                      <td>
                        <span className={`badge badge-${sem.status.toLowerCase()}`}>
                          {sem.status}
                        </span>
                      </td>
                      <td>{semCgpa}</td>
                      <td>
                        {isUpcoming ? '-' : (
                          <span className={`badge badge-${sem.performance ? sem.performance.toLowerCase() : 'medium'}`}>
                            {semPerf}
                          </span>
                        )}
                      </td>
                      <td>{semAtt}</td>
                      <td>-</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
