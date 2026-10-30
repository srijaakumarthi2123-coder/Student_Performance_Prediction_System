import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  LayoutDashboard, Users, BrainCircuit, BarChart3,
  Database, FileText, History, LogOut, GraduationCap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/performance-prediction', icon: BrainCircuit, label: 'Performance Prediction' },
    { path: '/analytics', icon: BarChart3, label: 'View Analytics' },
    { path: '/manage-dataset', icon: Database, label: 'Manage Dataset' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/prediction-history', icon: History, label: 'Prediction History' },
  ];


  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="brand-text">Student Performance</div>
            <div className="brand-sub">Prediction System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon className="nav-icon" size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-spacer" />
          <div className="sidebar-divider" />

          <button onClick={onLogout}>
            <LogOut className="nav-icon" size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Student Performance Prediction</h1>
            <p>Analyze • Predict • Improve</p>
          </div>
          <div className="header-right">
            <div className="admin-badge">
              <div className="admin-avatar">A</div>
              <span className="admin-info">Admin ▾</span>
            </div>
          </div>
        </header>

        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
}
