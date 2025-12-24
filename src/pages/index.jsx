import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import InventoryCount from "./InventoryCount";

import SecuritySettings from "./SecuritySettings";

import SystemDocumentation from "./SystemDocumentation";

import CodeAnalysis from "./CodeAnalysis";

import TestingStrategy from "./TestingStrategy";

import processCompletedCount from "./processCompletedCount";

import AdminPanel from "./AdminPanel";

import DevelopmentStrategy from "./DevelopmentStrategy";

import TechnicalSpecs from "./TechnicalSpecs";

import NewDelivery from "./NewDelivery";

import EditDelivery from "./EditDelivery";

import Orders from "./Orders";

import NewOrder from "./NewOrder";

import ManageReagents from "./ManageReagents";

import EditOrder from "./EditOrder";

import NewShipment from "./NewShipment";

import InventoryReplenishment from "./InventoryReplenishment";

import NewWithdrawalRequest from "./NewWithdrawalRequest";

import QualityAssurance from "./QualityAssurance";

import CleanupData from "./CleanupData";

import QuickCleanup from "./QuickCleanup";

import BackendManagement from "./BackendManagement";

import FixReagents from "./FixReagents";

import NewReagent from "./NewReagent";

import SystemAnalysis from "./SystemAnalysis";

import WithdrawalRequests from "./WithdrawalRequests";

import SupplyTracking from "./SupplyTracking";

import EditWithdrawalRequest from "./EditWithdrawalRequest";

import PerformanceAnalysis from "./PerformanceAnalysis";

import ActivityLog from "./ActivityLog";

import Contacts from "./Contacts";

import DashboardNotes from "./DashboardNotes";

import ImportContacts from "./ImportContacts";

import SystemSettings from "./SystemSettings";

import Deliveries from "./Deliveries";

import BatchAndExpiryManagement from "./BatchAndExpiryManagement";

import SystemManagement from "./SystemManagement";

import ArchivedDataViewer from "./ArchivedDataViewer";

import AlertsManagement from "./AlertsManagement";

import UploadCOA from "./UploadCOA";

import UsageDataManagement from "./UsageDataManagement";

import OutgoingShipments from "./OutgoingShipments";

import EditShipment from "./EditShipment";

import ManageSuppliers from "./ManageSuppliers";

import EditReagent from "./EditReagent";

import BatchAndExpiryTechnicalSpec from "./BatchAndExpiryTechnicalSpec";

import EditReagentBatch from "./EditReagentBatch";

import Reports from "./Reports";

import Login from "./Login";

import Register from "./Register";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth';

const PAGES = {
    
    Dashboard: Dashboard,
    
    InventoryCount: InventoryCount,
    
    SecuritySettings: SecuritySettings,
    
    SystemDocumentation: SystemDocumentation,
    
    CodeAnalysis: CodeAnalysis,
    
    TestingStrategy: TestingStrategy,
    
    processCompletedCount: processCompletedCount,
    
    AdminPanel: AdminPanel,
    
    DevelopmentStrategy: DevelopmentStrategy,
    
    TechnicalSpecs: TechnicalSpecs,
    
    NewDelivery: NewDelivery,
    
    EditDelivery: EditDelivery,
    
    Orders: Orders,
    
    NewOrder: NewOrder,
    
    ManageReagents: ManageReagents,
    
    EditOrder: EditOrder,
    
    NewShipment: NewShipment,
    
    InventoryReplenishment: InventoryReplenishment,
    
    NewWithdrawalRequest: NewWithdrawalRequest,
    
    QualityAssurance: QualityAssurance,
    
    CleanupData: CleanupData,
    
    QuickCleanup: QuickCleanup,
    
    BackendManagement: BackendManagement,
    
    FixReagents: FixReagents,
    
    NewReagent: NewReagent,
    
    SystemAnalysis: SystemAnalysis,
    
    WithdrawalRequests: WithdrawalRequests,
    
    SupplyTracking: SupplyTracking,
    
    EditWithdrawalRequest: EditWithdrawalRequest,
    
    PerformanceAnalysis: PerformanceAnalysis,
    
    ActivityLog: ActivityLog,
    
    Contacts: Contacts,
    
    DashboardNotes: DashboardNotes,
    
    ImportContacts: ImportContacts,
    
    SystemSettings: SystemSettings,
    
    Deliveries: Deliveries,
    
    BatchAndExpiryManagement: BatchAndExpiryManagement,
    
    SystemManagement: SystemManagement,
    
    ArchivedDataViewer: ArchivedDataViewer,
    
    AlertsManagement: AlertsManagement,
    
    UploadCOA: UploadCOA,
    
    UsageDataManagement: UsageDataManagement,
    
    OutgoingShipments: OutgoingShipments,
    
    EditShipment: EditShipment,
    
    ManageSuppliers: ManageSuppliers,
    
    EditReagent: EditReagent,
    
    BatchAndExpiryTechnicalSpec: BatchAndExpiryTechnicalSpec,
    
    EditReagentBatch: EditReagentBatch,
    
    Reports: Reports,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/Dashboard" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
                
                <Route path="/InventoryCount" element={<ProtectedRoute><Layout currentPageName={currentPage}><InventoryCount /></Layout></ProtectedRoute>} />
                <Route path="/SecuritySettings" element={<ProtectedRoute><Layout currentPageName={currentPage}><SecuritySettings /></Layout></ProtectedRoute>} />
                <Route path="/SystemDocumentation" element={<ProtectedRoute><Layout currentPageName={currentPage}><SystemDocumentation /></Layout></ProtectedRoute>} />
                <Route path="/CodeAnalysis" element={<ProtectedRoute><Layout currentPageName={currentPage}><CodeAnalysis /></Layout></ProtectedRoute>} />
                <Route path="/TestingStrategy" element={<ProtectedRoute><Layout currentPageName={currentPage}><TestingStrategy /></Layout></ProtectedRoute>} />
                <Route path="/processCompletedCount" element={<ProtectedRoute><Layout currentPageName={currentPage}><processCompletedCount /></Layout></ProtectedRoute>} />
                <Route path="/AdminPanel" element={<ProtectedRoute><Layout currentPageName={currentPage}><AdminPanel /></Layout></ProtectedRoute>} />
                <Route path="/DevelopmentStrategy" element={<ProtectedRoute><Layout currentPageName={currentPage}><DevelopmentStrategy /></Layout></ProtectedRoute>} />
                <Route path="/TechnicalSpecs" element={<ProtectedRoute><Layout currentPageName={currentPage}><TechnicalSpecs /></Layout></ProtectedRoute>} />
                <Route path="/NewDelivery" element={<ProtectedRoute><Layout currentPageName={currentPage}><NewDelivery /></Layout></ProtectedRoute>} />
                <Route path="/EditDelivery" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditDelivery /></Layout></ProtectedRoute>} />
                <Route path="/Orders" element={<ProtectedRoute><Layout currentPageName={currentPage}><Orders /></Layout></ProtectedRoute>} />
                <Route path="/NewOrder" element={<ProtectedRoute><Layout currentPageName={currentPage}><NewOrder /></Layout></ProtectedRoute>} />
                <Route path="/ManageReagents" element={<ProtectedRoute><Layout currentPageName={currentPage}><ManageReagents /></Layout></ProtectedRoute>} />
                <Route path="/EditOrder" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditOrder /></Layout></ProtectedRoute>} />
                <Route path="/NewShipment" element={<ProtectedRoute><Layout currentPageName={currentPage}><NewShipment /></Layout></ProtectedRoute>} />
                <Route path="/InventoryReplenishment" element={<ProtectedRoute><Layout currentPageName={currentPage}><InventoryReplenishment /></Layout></ProtectedRoute>} />
                <Route path="/NewWithdrawalRequest" element={<ProtectedRoute><Layout currentPageName={currentPage}><NewWithdrawalRequest /></Layout></ProtectedRoute>} />
                <Route path="/QualityAssurance" element={<ProtectedRoute><Layout currentPageName={currentPage}><QualityAssurance /></Layout></ProtectedRoute>} />
                <Route path="/CleanupData" element={<ProtectedRoute><Layout currentPageName={currentPage}><CleanupData /></Layout></ProtectedRoute>} />
                <Route path="/QuickCleanup" element={<ProtectedRoute><Layout currentPageName={currentPage}><QuickCleanup /></Layout></ProtectedRoute>} />
                <Route path="/BackendManagement" element={<ProtectedRoute><Layout currentPageName={currentPage}><BackendManagement /></Layout></ProtectedRoute>} />
                <Route path="/FixReagents" element={<ProtectedRoute><Layout currentPageName={currentPage}><FixReagents /></Layout></ProtectedRoute>} />
                <Route path="/NewReagent" element={<ProtectedRoute><Layout currentPageName={currentPage}><NewReagent /></Layout></ProtectedRoute>} />
                <Route path="/SystemAnalysis" element={<ProtectedRoute><Layout currentPageName={currentPage}><SystemAnalysis /></Layout></ProtectedRoute>} />
                <Route path="/WithdrawalRequests" element={<ProtectedRoute><Layout currentPageName={currentPage}><WithdrawalRequests /></Layout></ProtectedRoute>} />
                <Route path="/SupplyTracking" element={<ProtectedRoute><Layout currentPageName={currentPage}><SupplyTracking /></Layout></ProtectedRoute>} />
                <Route path="/EditWithdrawalRequest" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditWithdrawalRequest /></Layout></ProtectedRoute>} />
                <Route path="/PerformanceAnalysis" element={<ProtectedRoute><Layout currentPageName={currentPage}><PerformanceAnalysis /></Layout></ProtectedRoute>} />
                <Route path="/ActivityLog" element={<ProtectedRoute><Layout currentPageName={currentPage}><ActivityLog /></Layout></ProtectedRoute>} />
                <Route path="/Contacts" element={<ProtectedRoute><Layout currentPageName={currentPage}><Contacts /></Layout></ProtectedRoute>} />
                <Route path="/DashboardNotes" element={<ProtectedRoute><Layout currentPageName={currentPage}><DashboardNotes /></Layout></ProtectedRoute>} />
                <Route path="/ImportContacts" element={<ProtectedRoute><Layout currentPageName={currentPage}><ImportContacts /></Layout></ProtectedRoute>} />
                <Route path="/SystemSettings" element={<ProtectedRoute><Layout currentPageName={currentPage}><SystemSettings /></Layout></ProtectedRoute>} />
                <Route path="/Deliveries" element={<ProtectedRoute><Layout currentPageName={currentPage}><Deliveries /></Layout></ProtectedRoute>} />
                <Route path="/BatchAndExpiryManagement" element={<ProtectedRoute><Layout currentPageName={currentPage}><BatchAndExpiryManagement /></Layout></ProtectedRoute>} />
                <Route path="/SystemManagement" element={<ProtectedRoute><Layout currentPageName={currentPage}><SystemManagement /></Layout></ProtectedRoute>} />
                <Route path="/ArchivedDataViewer" element={<ProtectedRoute><Layout currentPageName={currentPage}><ArchivedDataViewer /></Layout></ProtectedRoute>} />
                <Route path="/AlertsManagement" element={<ProtectedRoute><Layout currentPageName={currentPage}><AlertsManagement /></Layout></ProtectedRoute>} />
                <Route path="/UploadCOA" element={<ProtectedRoute><Layout currentPageName={currentPage}><UploadCOA /></Layout></ProtectedRoute>} />
                <Route path="/UsageDataManagement" element={<ProtectedRoute><Layout currentPageName={currentPage}><UsageDataManagement /></Layout></ProtectedRoute>} />
                <Route path="/OutgoingShipments" element={<ProtectedRoute><Layout currentPageName={currentPage}><OutgoingShipments /></Layout></ProtectedRoute>} />
                <Route path="/EditShipment" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditShipment /></Layout></ProtectedRoute>} />
                <Route path="/ManageSuppliers" element={<ProtectedRoute><Layout currentPageName={currentPage}><ManageSuppliers /></Layout></ProtectedRoute>} />
                <Route path="/EditReagent" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditReagent /></Layout></ProtectedRoute>} />
                <Route path="/BatchAndExpiryTechnicalSpec" element={<ProtectedRoute><Layout currentPageName={currentPage}><BatchAndExpiryTechnicalSpec /></Layout></ProtectedRoute>} />
                <Route path="/EditReagentBatch" element={<ProtectedRoute><Layout currentPageName={currentPage}><EditReagentBatch /></Layout></ProtectedRoute>} />
                <Route path="/Reports" element={<ProtectedRoute><Layout currentPageName={currentPage}><Reports /></Layout></ProtectedRoute>} />
            </Routes>
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