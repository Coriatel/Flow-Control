import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth";
import { Loader2 } from "lucide-react";

import Layout from "./Layout.jsx";
import Login from "./Login";
import Register from "./Register";

const Dashboard = React.lazy(() => import("./Dashboard"));
const InventoryCount = React.lazy(() => import("./InventoryCount"));
const SecuritySettings = React.lazy(() => import("./SecuritySettings"));
const SystemDocumentation = React.lazy(() => import("./SystemDocumentation"));
const CodeAnalysis = React.lazy(() => import("./CodeAnalysis"));
const TestingStrategy = React.lazy(() => import("./TestingStrategy"));
const ProcessCompletedCount = React.lazy(
  () => import("./processCompletedCount"),
);
const AdminPanel = React.lazy(() => import("./AdminPanel"));
const DevelopmentStrategy = React.lazy(() => import("./DevelopmentStrategy"));
const TechnicalSpecs = React.lazy(() => import("./TechnicalSpecs"));
const NewDelivery = React.lazy(() => import("./NewDelivery"));
const EditDelivery = React.lazy(() => import("./EditDelivery"));
const Orders = React.lazy(() => import("./Orders"));
const NewOrder = React.lazy(() => import("./NewOrder"));
const ManageReagents = React.lazy(() => import("./ManageReagents"));
const EditOrder = React.lazy(() => import("./EditOrder"));
const NewShipment = React.lazy(() => import("./NewShipment"));
const InventoryReplenishment = React.lazy(
  () => import("./InventoryReplenishment"),
);
const NewWithdrawalRequest = React.lazy(() => import("./NewWithdrawalRequest"));
const QualityAssurance = React.lazy(() => import("./QualityAssurance"));
const CleanupData = React.lazy(() => import("./CleanupData"));
const QuickCleanup = React.lazy(() => import("./QuickCleanup"));
const BackendManagement = React.lazy(() => import("./BackendManagement"));
const FixReagents = React.lazy(() => import("./FixReagents"));
const NewReagent = React.lazy(() => import("./NewReagent"));
const SystemAnalysis = React.lazy(() => import("./SystemAnalysis"));
const WithdrawalRequests = React.lazy(() => import("./WithdrawalRequests"));
const SupplyTracking = React.lazy(() => import("./SupplyTracking"));
const EditWithdrawalRequest = React.lazy(
  () => import("./EditWithdrawalRequest"),
);
const PerformanceAnalysis = React.lazy(() => import("./PerformanceAnalysis"));
const ActivityLog = React.lazy(() => import("./ActivityLog"));
const Contacts = React.lazy(() => import("./Contacts"));
const DashboardNotes = React.lazy(() => import("./DashboardNotes"));
const ImportContacts = React.lazy(() => import("./ImportContacts"));
const SystemSettings = React.lazy(() => import("./SystemSettings"));
const Deliveries = React.lazy(() => import("./Deliveries"));
const BatchAndExpiryManagement = React.lazy(
  () => import("./BatchAndExpiryManagement"),
);
const SystemManagement = React.lazy(() => import("./SystemManagement"));
const ArchivedDataViewer = React.lazy(() => import("./ArchivedDataViewer"));
const AlertsManagement = React.lazy(() => import("./AlertsManagement"));
const UploadCOA = React.lazy(() => import("./UploadCOA"));
const UsageDataManagement = React.lazy(() => import("./UsageDataManagement"));
const OutgoingShipments = React.lazy(() => import("./OutgoingShipments"));
const EditShipment = React.lazy(() => import("./EditShipment"));
const ManageSuppliers = React.lazy(() => import("./ManageSuppliers"));
const EditReagent = React.lazy(() => import("./EditReagent"));
const BatchAndExpiryTechnicalSpec = React.lazy(
  () => import("./BatchAndExpiryTechnicalSpec"),
);
const EditReagentBatch = React.lazy(() => import("./EditReagentBatch"));
const Reports = React.lazy(() => import("./Reports"));
const DispenseItems = React.lazy(() => import("./DispenseItems"));
const ItemsInUse = React.lazy(() => import("./ItemsInUse"));
const InventoryRemoval = React.lazy(() => import("./InventoryRemoval"));
const Messages = React.lazy(() => import("./Messages"));

const PAGES = {
  Dashboard,
  InventoryCount,
  SecuritySettings,
  SystemDocumentation,
  CodeAnalysis,
  TestingStrategy,
  processCompletedCount: ProcessCompletedCount,
  AdminPanel,
  DevelopmentStrategy,
  TechnicalSpecs,
  NewDelivery,
  EditDelivery,
  Orders,
  NewOrder,
  ManageReagents,
  EditOrder,
  NewShipment,
  InventoryReplenishment,
  NewWithdrawalRequest,
  QualityAssurance,
  CleanupData,
  QuickCleanup,
  BackendManagement,
  FixReagents,
  NewReagent,
  SystemAnalysis,
  WithdrawalRequests,
  SupplyTracking,
  EditWithdrawalRequest,
  PerformanceAnalysis,
  ActivityLog,
  Contacts,
  DashboardNotes,
  ImportContacts,
  SystemSettings,
  Deliveries,
  BatchAndExpiryManagement,
  SystemManagement,
  ArchivedDataViewer,
  AlertsManagement,
  UploadCOA,
  UsageDataManagement,
  OutgoingShipments,
  EditShipment,
  ManageSuppliers,
  EditReagent,
  BatchAndExpiryTechnicalSpec,
  EditReagentBatch,
  Reports,
  DispenseItems,
  ItemsInUse,
  InventoryRemoval,
  Messages,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase(),
  );
  return pageName || Object.keys(PAGES)[0];
}

function PageLoader() {
  return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/InventoryCount"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <InventoryCount />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SecuritySettings"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SecuritySettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SystemDocumentation"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SystemDocumentation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/CodeAnalysis"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <CodeAnalysis />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/TestingStrategy"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <TestingStrategy />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/processCompletedCount"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ProcessCompletedCount />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/AdminPanel"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/DevelopmentStrategy"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <DevelopmentStrategy />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/TechnicalSpecs"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <TechnicalSpecs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/NewDelivery"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <NewDelivery />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditDelivery"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditDelivery />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Orders"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/NewOrder"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <NewOrder />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ManageReagents"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ManageReagents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditOrder"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditOrder />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/NewShipment"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <NewShipment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/InventoryReplenishment"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <InventoryReplenishment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/NewWithdrawalRequest"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <NewWithdrawalRequest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/QualityAssurance"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <QualityAssurance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/CleanupData"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <CleanupData />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/QuickCleanup"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <QuickCleanup />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/BackendManagement"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <BackendManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/FixReagents"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <FixReagents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/NewReagent"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <NewReagent />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SystemAnalysis"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SystemAnalysis />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/WithdrawalRequests"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <WithdrawalRequests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SupplyTracking"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SupplyTracking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditWithdrawalRequest"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditWithdrawalRequest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/PerformanceAnalysis"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <PerformanceAnalysis />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ActivityLog"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ActivityLog />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Contacts"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Contacts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/DashboardNotes"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <DashboardNotes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ImportContacts"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ImportContacts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SystemSettings"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SystemSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Deliveries"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Deliveries />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/BatchAndExpiryManagement"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <BatchAndExpiryManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/SystemManagement"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <SystemManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ArchivedDataViewer"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ArchivedDataViewer />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/AlertsManagement"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <AlertsManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/UploadCOA"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <UploadCOA />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/UsageDataManagement"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <UsageDataManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/OutgoingShipments"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <OutgoingShipments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditShipment"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditShipment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ManageSuppliers"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ManageSuppliers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditReagent"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditReagent />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/BatchAndExpiryTechnicalSpec"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <BatchAndExpiryTechnicalSpec />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EditReagentBatch"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <EditReagentBatch />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Reports"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/DispenseItems"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <DispenseItems />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ItemsInUse"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <ItemsInUse />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/InventoryRemoval"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <InventoryRemoval />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Messages"
          element={
            <ProtectedRoute>
              <Layout currentPageName={currentPage}>
                <Messages />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function Pages() {
  return (
    <Router>
      <AuthProvider>
        <PagesContent />
      </AuthProvider>
    </Router>
  );
}
