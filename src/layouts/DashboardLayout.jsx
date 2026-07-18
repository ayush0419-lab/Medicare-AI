import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Settings, 
  LogOut, Menu, X, Bell, Search, Check, AlertCircle, CheckSquare, Stethoscope,
  Brain, FileText, ShieldAlert, Scan, MapPin, Apple, MessageSquare, Sun, Moon,
  FolderOpen, FileSignature, Clipboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../context/ThemeContext';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { resolved, setPreference } = useTheme();
  const navigate = useNavigate();
  const initials = (profile?.full_name || 'MediCare')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const allNavItems = [
    { name: 'Overview',        path: '/dashboard',                    icon: LayoutDashboard, roles: null },
    { name: 'Report Analyzer', path: '/dashboard/report-analyzer',    icon: FileText,        roles: ['patient'] },
    { name: 'Symptom Checker', path: '/dashboard/symptom-checker',    icon: Brain,           roles: ['patient'] },
    { name: 'Documents',       path: '/dashboard/documents',          icon: FolderOpen,      roles: ['patient'] },
    { name: 'Emergency SOS',   path: '/dashboard/emergency-sos',      icon: ShieldAlert,     roles: ['patient'] },
    { name: 'Hospital Finder', path: '/dashboard/hospital-finder',    icon: MapPin,          roles: ['patient'] },
    { name: 'Diet Planner',    path: '/dashboard/diet-planner',       icon: Apple,           roles: ['patient'] },
    { name: 'Medical Chat',    path: '/dashboard/medical-chat',       icon: MessageSquare,   roles: ['patient'] },
    { name: 'Doctors',         path: '/dashboard/doctors',            icon: Stethoscope,     roles: ['admin'] },
    { name: 'Admin Console',   path: '/dashboard/admin',              icon: ShieldAlert,     roles: ['admin'] },
    { name: 'Appointments',    path: '/dashboard/appointments',       icon: Calendar,        roles: ['patient', 'admin'] },
    { name: 'Manage Appointments', path: '/dashboard/manage-appointments', icon: Calendar,    roles: ['doctor'] },
    { name: 'Reports Viewer',      path: '/dashboard/report-viewer',      icon: FileText,        roles: ['doctor'] },
    { name: 'Doctor AI Assistant', path: '/dashboard/doctor-chat',         icon: MessageSquare,   roles: ['doctor'] },
    { name: 'Consultation Notes',  path: '/dashboard/consultations',       icon: Clipboard,       roles: ['doctor', 'patient'] },
    { name: 'Digital Prescriptions', path: '/dashboard/prescriptions',    icon: FileSignature, roles: ['doctor', 'patient'] },
    { name: 'Settings',        path: '/dashboard/settings',           icon: Settings,        roles: null },
  ];

  // Filter nav items by role — null means visible to everyone
  const navItems = allNavItems.filter(
    item => !item.roles || item.roles.includes(profile?.role)
  );

  return (
    <div className="min-h-screen font-sans flex bg-slate-50 dark:bg-[#070b19] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Lightweight CSS background — replaces heavy Three.js canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full
                        bg-gradient-to-br from-indigo-100/60 dark:from-indigo-500/10 via-violet-100/40 dark:via-violet-500/5 to-transparent
                        blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full
                        bg-gradient-to-tr from-cyan-100/50 dark:from-cyan-500/10 via-blue-100/30 dark:via-blue-500/5 to-transparent
                        blur-3xl" />
        <div className="absolute inset-0 clinical-grid opacity-30 dark:opacity-10" />
      </div>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border-r border-white dark:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/50 dark:border-white/5 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="w-7 h-7 rounded border border-white/50 dark:border-white/5 bg-white/50 dark:bg-slate-850 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
              <img src="/logo.png" alt="MediCare-AI Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">MediCare-AI</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
          {/* General Workspace category */}
          <div className="flex flex-col gap-1">
            <div className="px-2 mb-2">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Workspace</p>
            </div>
            {navItems.filter(item => !['Report Analyzer', 'Symptom Checker', 'Emergency SOS', 'Hospital Finder', 'Diet Planner', 'Medical Chat', 'Documents'].includes(item.name)).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-white/5 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Patients Service Suite category */}
          {navItems.some(item => ['Report Analyzer', 'Symptom Checker', 'Emergency SOS', 'Hospital Finder', 'Diet Planner', 'Medical Chat', 'Documents'].includes(item.name)) && (
            <div className="flex flex-col gap-1">
              <div className="px-2 mb-2">
                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Patient Services</p>
              </div>
              {navItems.filter(item => ['Report Analyzer', 'Symptom Checker', 'Emergency SOS', 'Hospital Finder', 'Diet Planner', 'Medical Chat', 'Documents'].includes(item.name)).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-white/5 text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0">
          <div className="holo-surface p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.9)]">
                {initials || 'MC'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.full_name || 'MediCare User'}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{profile?.specialty || profile?.role || 'Clinical workspace'}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top Header */}
        <header className="h-16 bg-white/50 dark:bg-[#070b19]/60 backdrop-blur-xl border-b border-white/50 dark:border-white/5 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search Decoration */}
            <div className="hidden sm:flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-lg px-3 py-1.5 w-64 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-inner">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2" />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex-1">Clinical search...</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-100 dark:border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">System Normal</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setPreference(resolved === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-900 cursor-pointer shadow-sm flex items-center justify-center"
              title={`Switch to ${resolved === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {resolved === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>
            
            {/* Real Interactive Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-900 shadow-sm cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-xl z-50 overflow-hidden text-left">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            markAllAsRead();
                            setNotificationsOpen(false);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 hover:bg-slate-50/50 transition-colors flex gap-3 items-start ${!n.read ? 'bg-indigo-50/30' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'success' ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : n.type === 'error' ? (
                              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                <AlertCircle className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Bell className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs text-slate-700 leading-normal ${!n.read ? 'font-semibold text-slate-900' : ''}`}>
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                              {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {!n.read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="shrink-0 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-center bg-indigo-50 hover:bg-indigo-100/80 border border-transparent rounded px-1.5 py-0.5"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
