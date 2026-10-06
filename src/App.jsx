import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { TaskModal } from './components/TaskModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ManagersPage } from './pages/ManagersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AttendancePage } from './pages/AttendancePage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LoginPage } from './pages/LoginPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';
import { api } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();
  const { lastSocketEvent } = useSocket();

  const [currentTab, setCurrentTab] = useState('calendar'); // Default to Weekly Calendar as requested
  const [tasks, setTasks] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Hash-based routing for Employee Access Link: e.g. #/employee/:token
  const [employeeToken, setEmployeeToken] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/employee/')) {
      return hash.replace('#/employee/', '').trim();
    }
    return null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/employee/')) {
        setEmployeeToken(hash.replace('#/employee/', '').trim());
      } else {
        setEmployeeToken(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch initial tasks & counts
  const loadData = async () => {
    if (!user) return;
    try {
      const [taskRes, subRes, notifRes] = await Promise.all([
        api.tasks.getAll(),
        api.submissions.getAll({ status: 'Submitted' }),
        api.notifications.getAll()
      ]);
      setTasks(taskRes.tasks || []);
      setPendingApprovalsCount(subRes.submissions?.length || 0);
      setUnreadNotifications(notifRes.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching company data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Reactive real-time socket events trigger instant updates!
  useEffect(() => {
    if (lastSocketEvent) {
      loadData();
    }
  }, [lastSocketEvent]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-medium)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Inkepen Platform...</p>
        </div>
      </div>
    );
  }

  // If visiting an employee access link directly OR logged in as employee
  if (employeeToken || user?.role === 'employee') {
    const activeToken = employeeToken || user?.token || user?.employee_token;
    return (
      <EmployeePortalPage
        token={activeToken}
        onBackToAdmin={() => {
          window.location.hash = '';
          setEmployeeToken(null);
        }}
      />
    );
  }

  // If not logged in, render Login page
  if (!user) {
    return (
      <LoginPage
        onOpenEmployeePortal={(tok) => {
          window.location.hash = `#/employee/${tok}`;
          setEmployeeToken(tok);
        }}
      />
    );
  }

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenCreateTask={() => setShowCreateTaskModal(true)}
          unreadCount={unreadNotifications}
          onOpenNotifications={() => setCurrentTab('notifications')}
        />

        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
          {/* Left Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            pendingApprovalsCount={pendingApprovalsCount}
            onOpenCreateTask={() => setShowCreateTaskModal(true)}
          />

          {/* Page Body Viewport */}
          <main className="page-body">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onSelectTab={setCurrentTab}
                onSelectTask={setSelectedTask}
                onOpenCreateTask={() => setShowCreateTaskModal(true)}
              />
            )}

            {currentTab === 'calendar' && (
              <div>
                <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      Weekly Task Schedule
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                      Drag and drop task cards to reschedule dates or time windows in real-time.
                    </p>
                  </div>
                </div>

                <CalendarView
                  tasks={tasks}
                  onSelectTask={setSelectedTask}
                  onOpenCreateTask={() => setShowCreateTaskModal(true)}
                  onRefresh={loadData}
                  isAdminOrManager={isAdminOrManager}
                />
              </div>
            )}

            {currentTab === 'tasks' && (
              <TasksPage
                onSelectTask={setSelectedTask}
                onOpenCreateTask={() => setShowCreateTaskModal(true)}
                isAdminOrManager={isAdminOrManager}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesPage
                onOpenCreateTask={() => setShowCreateTaskModal(true)}
              />
            )}

            {currentTab === 'managers' && <ManagersPage />}
            {currentTab === 'departments' && <DepartmentsPage />}
            {currentTab === 'submissions' && <ApprovalsPage />}
            {currentTab === 'approvals' && <ApprovalsPage />}
            {currentTab === 'attendance' && <AttendancePage />}
            {currentTab === 'notifications' && <NotificationsPage />}
            {currentTab === 'reports' && <ReportsPage />}
            {currentTab === 'activity' && <ActivityLogPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </main>
        </div>
      </div>

      {/* Global Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRefresh={loadData}
          isAdminOrManager={isAdminOrManager}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateTaskModal
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={() => {
            loadData();
          }}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectTask={(task) => setSelectedTask(task)}
        onSelectEmployee={() => setCurrentTab('employees')}
        onSelectDepartment={() => setCurrentTab('departments')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
