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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/InventoryCount" element={<InventoryCount />} />
                
                <Route path="/SecuritySettings" element={<SecuritySettings />} />
                
                <Route path="/SystemDocumentation" element={<SystemDocumentation />} />
                
                <Route path="/CodeAnalysis" element={<CodeAnalysis />} />
                
                <Route path="/TestingStrategy" element={<TestingStrategy />} />
                
                <Route path="/processCompletedCount" element={<processCompletedCount />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/DevelopmentStrategy" element={<DevelopmentStrategy />} />
                
                <Route path="/TechnicalSpecs" element={<TechnicalSpecs />} />
                
                <Route path="/NewDelivery" element={<NewDelivery />} />
                
                <Route path="/EditDelivery" element={<EditDelivery />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/NewOrder" element={<NewOrder />} />
                
                <Route path="/ManageReagents" element={<ManageReagents />} />
                
                <Route path="/EditOrder" element={<EditOrder />} />
                
                <Route path="/NewShipment" element={<NewShipment />} />
                
                <Route path="/InventoryReplenishment" element={<InventoryReplenishment />} />
                
                <Route path="/NewWithdrawalRequest" element={<NewWithdrawalRequest />} />
                
                <Route path="/QualityAssurance" element={<QualityAssurance />} />
                
                <Route path="/CleanupData" element={<CleanupData />} />
                
                <Route path="/QuickCleanup" element={<QuickCleanup />} />
                
                <Route path="/BackendManagement" element={<BackendManagement />} />
                
                <Route path="/FixReagents" element={<FixReagents />} />
                
                <Route path="/NewReagent" element={<NewReagent />} />
                
                <Route path="/SystemAnalysis" element={<SystemAnalysis />} />
                
                <Route path="/WithdrawalRequests" element={<WithdrawalRequests />} />
                
                <Route path="/SupplyTracking" element={<SupplyTracking />} />
                
                <Route path="/EditWithdrawalRequest" element={<EditWithdrawalRequest />} />
                
                <Route path="/PerformanceAnalysis" element={<PerformanceAnalysis />} />
                
                <Route path="/ActivityLog" element={<ActivityLog />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/DashboardNotes" element={<DashboardNotes />} />
                
                <Route path="/ImportContacts" element={<ImportContacts />} />
                
                <Route path="/SystemSettings" element={<SystemSettings />} />
                
                <Route path="/Deliveries" element={<Deliveries />} />
                
                <Route path="/BatchAndExpiryManagement" element={<BatchAndExpiryManagement />} />
                
                <Route path="/SystemManagement" element={<SystemManagement />} />
                
                <Route path="/ArchivedDataViewer" element={<ArchivedDataViewer />} />
                
                <Route path="/AlertsManagement" element={<AlertsManagement />} />
                
                <Route path="/UploadCOA" element={<UploadCOA />} />
                
                <Route path="/UsageDataManagement" element={<UsageDataManagement />} />
                
                <Route path="/OutgoingShipments" element={<OutgoingShipments />} />
                
                <Route path="/EditShipment" element={<EditShipment />} />
                
                <Route path="/ManageSuppliers" element={<ManageSuppliers />} />
                
                <Route path="/EditReagent" element={<EditReagent />} />
                
                <Route path="/BatchAndExpiryTechnicalSpec" element={<BatchAndExpiryTechnicalSpec />} />
                
                <Route path="/EditReagentBatch" element={<EditReagentBatch />} />
                
                <Route path="/Reports" element={<Reports />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}