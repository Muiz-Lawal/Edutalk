import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="route-loading-skeleton" aria-label="Loading page" />
);

// Lazy load all page components for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const BrowseClassesPage = React.lazy(() => import('./pages/BrowseClassesPage'));
const ClassDetailPage = React.lazy(() => import('./pages/ClassDetailPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ClassCreationPage = React.lazy(() => import('./pages/ClassCreationPage'));
const ClassSettingsPage = React.lazy(() => import('./pages/ClassSettingsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const HostDashboardPage = React.lazy(() => import('./pages/HostDashboardPage'));
const RecordingsPage = React.lazy(() => import('./pages/RecordingsPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const BundleBrowser = React.lazy(() => import('./pages/BundleBrowser'));
const BundleCreation = React.lazy(() => import('./pages/BundleCreation'));
const DynamicPricingPage = React.lazy(() => import('./pages/DynamicPricingPage'));
const DiscountManager = React.lazy(() => import('./pages/DiscountManager'));
const EnrollmentPage = React.lazy(() => import('./pages/EnrollmentPage'));
const PaymentHistoryPage = React.lazy(() => import('./pages/PaymentHistoryPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const BatchCheckoutPage = React.lazy(() => import('./pages/BatchCheckoutPage'));
const CheckoutConfirmationPage = React.lazy(() => import('./pages/CheckoutConfirmationPage'));
const ModerationPage = React.lazy(() => import('./pages/ModerationPage'));
const UserAppealsPage = React.lazy(() => import('./pages/UserAppealsPage'));
const LiveStreamHost = React.lazy(() => import('./pages/LiveStreamHost'));
const LiveStreamViewer = React.lazy(() => import('./pages/LiveStreamViewer'));
const StreamAnalyticsPage = React.lazy(() => import('./pages/StreamAnalyticsPage'));
const ScheduledStreamsPage = React.lazy(() => import('./pages/ScheduledStreamsPage'));
const ClassWaitingRoom = React.lazy(() => import('./pages/ClassWaitingRoom'));

// Phase 6B - Progress & Certificates
const StudentProgressPage = React.lazy(() => import('./pages/StudentProgressPage'));
const ClassProgressPage = React.lazy(() => import('./pages/ClassProgressPage'));
const HostProgressAnalyticsPage = React.lazy(() => import('./pages/HostProgressAnalyticsPage'));
const CertificateGalleryPage = React.lazy(() => import('./pages/CertificateGalleryPage'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const PointsHistoryPage = React.lazy(() => import('./pages/PointsHistoryPage'));

// Phase 6F - Analytics
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const AdminAnalyticsDashboard = React.lazy(() => import('./pages/AdminAnalyticsDashboard'));

// Admin Pages
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const AdminManagement = React.lazy(() => import('./pages/AdminManagement'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminSupport = React.lazy(() => import('./pages/AdminSupport'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminModeration = React.lazy(() => import('./pages/AdminModeration'));
const AdminPayments = React.lazy(() => import('./pages/AdminPayments'));
const AdminEmailJobs = React.lazy(() => import('./pages/AdminEmailJobs'));
const AdminHosts = React.lazy(() => import('./pages/AdminHosts'));
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));
const AdminLogs = React.lazy(() => import('./pages/AdminLogs'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));

// Lazy load heavy components
const VideoRoom = React.lazy(() => import('./components/VideoRoom'));
const TwoFASetup = React.lazy(() => import('./components/TwoFASetup'));
const SecurityDashboard = React.lazy(() => import('./components/SecurityDashboard'));
const ChangePassword = React.lazy(() => import('./components/ChangePassword'));
const AdminSecuritySettings = React.lazy(() => import('./components/AdminSecuritySettings'));

// Error Handling
import ErrorBoundary from './components/ErrorBoundary';

// PWA Components (not lazy loaded - critical)
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import UpdatePrompt from './components/UpdatePrompt';
import MobileNav from './components/MobileNav';
import PushPermissionRequest from './components/PushPermissionRequest';

// Styles
import './styles/global.css';
import './styles/mobile-utilities.css';
import './styles/ThemeSurface.css';
import './styles/AsyncBoundary.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AdminProvider>
            <Header />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Root Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/browse" element={<BrowseClassesPage />} />

                {/* Bundle Routes */}
                <Route
                  path="/create-bundle"
              element={
                <ProtectedRoute requireHost>
                  <BundleCreation />
                </ProtectedRoute>
              }
            />
            <Route path="/bundles/:bundleId/pricing" element={<DynamicPricingPage />} />
            <Route
              path="/discounts"
              element={
                <ProtectedRoute>
                  <DiscountManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class/:classId/enroll"
              element={
                <ProtectedRoute>
                  <EnrollmentPage />
                </ProtectedRoute>
              }
            />
            <Route
             path="/class/:classId/payment"
             element={
               <ProtectedRoute>
                 <EnrollmentPage />
               </ProtectedRoute>
             }
            />
            <Route
             path="/payments"
             element={
               <ProtectedRoute>
                 <PaymentHistoryPage />
               </ProtectedRoute>
             }
            />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout/batch" element={<ProtectedRoute><BatchCheckoutPage /></ProtectedRoute>} />
            <Route path="/checkout/confirmation" element={<ProtectedRoute><CheckoutConfirmationPage /></ProtectedRoute>} />
            <Route path="/class/:classId" element={<ClassDetailPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/host-dashboard"
              element={
                <ProtectedRoute requireHost>
                  <HostDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-class"
              element={<ProtectedRoute requireHost><ClassCreationPage /></ProtectedRoute>}
            />
            <Route
              path="/host/classes/new"
              element={<ProtectedRoute requireHost><ClassCreationPage /></ProtectedRoute>}
            />
            <Route
              path="/host/classes/:classId"
              element={<ProtectedRoute requireHost><ClassSettingsPage /></ProtectedRoute>}
            />
            <Route
              path="/recordings"
              element={
                <ProtectedRoute requireStudent>
                  <RecordingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:roomId"
              element={
                <ProtectedRoute>
                  <VideoRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderation"
              element={
                <ProtectedRoute requireAdmin>
                  <ModerationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appeals"
              element={
                <ProtectedRoute>
                  <UserAppealsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/go-live/:classId"
              element={
                <ProtectedRoute requireHost>
                  <LiveStreamHost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch/:streamId"
              element={
                <ProtectedRoute>
                  <LiveStreamViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/streams/:streamId"
              element={
                <ProtectedRoute requireHost>
                  <StreamAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules"
              element={
                <ProtectedRoute requireHost>
                  <ScheduledStreamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch/:streamId/waiting"
              element={
                <ProtectedRoute>
                  <ClassWaitingRoom />
                </ProtectedRoute>
              }
            />

            {/* Phase 6B - Progress & Certificates Routes */}
            <Route
              path="/student-progress"
              element={
                <ProtectedRoute requireStudent>
                  <StudentProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute requireStudent>
                  <AchievementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/points"
              element={
                <ProtectedRoute requireStudent>
                  <PointsHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class/:classId/progress"
              element={
                <ProtectedRoute requireStudent>
                  <ClassProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/class/:classId/progress"
              element={
                <ProtectedRoute requireHost>
                  <HostProgressAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute requireStudent>
                  <CertificateGalleryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class/:classId/leaderboard"
              element={
                <ProtectedRoute requireStudent>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />

            {/* Phase 6F - Analytics Routes */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requireHost>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/support"
              element={
                <ProtectedRoute requireAdmin requirePermission="view_support_dashboard">
                  <AdminSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin requirePermission={['manage_users', 'view_user_profiles_readonly']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute requireAdmin requirePermission="moderate_content">
                  <AdminModeration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-jobs"
              element={
                <ProtectedRoute requireAdmin requirePermission="manage_admins">
                  <AdminEmailJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requireAdmin requirePermission="view_payments">
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hosts"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminHosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requireAdmin requirePermission="view_audit_logs">
                  <AdminAnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requireAdmin requirePermission="view_audit_logs">
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin requirePermission="manage_admins">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/management"
              element={
                <ProtectedRoute requireAdmin requireSuperAdmin>
                  <AdminManagement />
                </ProtectedRoute>
              }
            />

            {/* Security Routes */}
            <Route
              path="/admin/security/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <SecurityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSecuritySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security/2fa-setup"
              element={
                <ProtectedRoute requireAdmin>
                  <TwoFASetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security/change-password"
              element={
                <ProtectedRoute requireAdmin>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
           </Suspense>
            
           {/* PWA Components - Added safely outside routes */}
           <div style={{ display: 'none' }}>
             <UpdatePrompt />
             <OfflineIndicator />
             <PWAInstallPrompt />
             <PushPermissionRequest />
           </div>
         </AdminProvider>
       </AuthProvider>
     </Router>
    </ErrorBoundary>
  );
}

export default App;
