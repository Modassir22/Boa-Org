import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Download, RefreshCw } from 'lucide-react';

// Import tab components
import SeminarsTab from './tabs/SeminarsTab';
import UsersTab from './tabs/UsersTab';
import RegistrationsTab from './tabs/RegistrationsTab';
import NotificationsTab from './tabs/NotificationsTab';
import StatisticsTab from './tabs/StatisticsTab';
import FeeStructureTab from './tabs/FeeStructureTab';
import OfflineUsersTab from './tabs/OfflineUsersTab';
import CommitteeMembersTab from './tabs/CommitteeMembersTab';
import { CertificationTab } from './tabs/CertificationTab';
import UpcomingEventsTab from './tabs/UpcomingEventsTab';
import { ContactInfoTab } from './tabs/ContactInfoTab';
import { SiteConfigTab } from './tabs/SiteConfigTab';
import { OfflineFormsTab } from './tabs/OfflineFormsTab';
import { GalleryTab } from './tabs/GalleryTab';
import MembershipCategoriesTab from './tabs/MembershipCategoriesTab';
import ResourcesTab from './tabs/ResourcesTab';
import AllPaymentsTab from './tabs/AllPaymentsTab';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('statistics');

  useEffect(() => {
    // Set page title for admin panel
    document.title = 'Admin Panel - Bihar Ophthalmic Association';
    
    // Restore original title when component unmounts
    return () => {
      document.title = 'Bihar Ophthalmic Association';
    };
  }, []);

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminStr = localStorage.getItem('admin');
    
    console.log('🔍 Admin Auth Check:', {
      hasToken: !!adminToken,
      tokenLength: adminToken?.length,
      hasAdminData: !!adminStr
    });
    
    if (!adminToken) {
      console.error('❌ No admin token found - redirecting to login');
      toast({
        title: 'Access Denied',
        description: 'Please login as admin to access this panel',
        variant: 'destructive',
      });
      navigate('/admin-login');
      return;
    }
    
    try {
      const admin = JSON.parse(adminStr || '{}');
      if (!admin.id) {
        console.error('❌ Invalid admin data - redirecting to login');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin-login');
      } else {
        console.log('✅ Admin authenticated:', admin.username);
      }
    } catch (error) {
      console.error('❌ Failed to parse admin data:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      navigate('/admin-login');
    }
  }, [navigate, toast]);

  const handleExportAll = async () => {
    try {
      const blob = await adminAPI.exportRegistrations();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOA_Registrations_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: 'Registrations exported to Excel',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export registrations',
        variant: 'destructive',
      });
    }
  };

  const handleReLogin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    toast({
      title: 'Logged Out',
      description: 'Please login again',
    });
    navigate('/admin-login');
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage seminars, users, and registrations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleReLogin} 
            variant="outline"
            size="icon"
            title="Re-login"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleExportAll} className="gradient-primary text-primary-foreground">
            <Download className="mr-2 h-4 w-4" />
            Export All Registrations
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'seminars' && <SeminarsTab />}
        {activeTab === 'fees' && <FeeStructureTab />}
        {activeTab === 'registrations' && <RegistrationsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'offline-users' && <OfflineUsersTab />}
        {activeTab === 'all-payments' && <AllPaymentsTab />}
        {activeTab === 'committee' && <CommitteeMembersTab />}
        {activeTab === 'certification' && <CertificationTab />}
        {activeTab === 'upcoming' && <UpcomingEventsTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'membership-categories' && <MembershipCategoriesTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'contact' && <ContactInfoTab />}
        {activeTab === 'site-config' && <SiteConfigTab />}
        {activeTab === 'offline-forms' && <OfflineFormsTab />}
      </div>
    </AdminLayout>
  );
}
