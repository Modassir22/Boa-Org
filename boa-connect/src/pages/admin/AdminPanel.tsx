import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

// Import tab components
import SeminarsTab from './tabs/SeminarsTab';
import UsersTab from './tabs/UsersTab';
import RegistrationsTab from './tabs/RegistrationsTab';
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
import MembershipManagementTab from './tabs/MembershipManagementTab';
import ResourcesTab from './tabs/ResourcesTab';
import AllPaymentsTab from './tabs/AllPaymentsTab';
import TestimonialsTab from './tabs/TestimonialsTab';
import NewsTab from './tabs/NewsTab';
import GalleryManagementTab from './tabs/GalleryManagementTab';
import StatsTab from './tabs/StatsTab';
import ElectionsTab from './tabs/ElectionsTab';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('statistics');

  useEffect(() => {
    // Set page title for admin panel
    document.title = 'Admin Panel - Ophthalmic Association Of Bihar';
    
    // Restore original title when component unmounts
    return () => {
      document.title = 'Ophthalmic Association Of Bihar';
    };
  }, []);

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminStr = localStorage.getItem('admin');
    
    if (!adminToken) {
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
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin-login');
      } 
    } catch (error) {
      console.error('❌ Failed to parse admin data:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      navigate('/admin-login');
    }
  }, [navigate, toast]);

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
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'seminars' && <SeminarsTab />}
        {activeTab === 'fees' && <FeeStructureTab />}
        {activeTab === 'registrations' && <RegistrationsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'offline-users' && <OfflineUsersTab />}
        {activeTab === 'membership-management' && <MembershipManagementTab />}
        {activeTab === 'all-payments' && <AllPaymentsTab />}
        {activeTab === 'committee' && <CommitteeMembersTab />}
        {activeTab === 'certification' && <CertificationTab />}
        {activeTab === 'upcoming' && <UpcomingEventsTab />}
        {activeTab === 'elections' && <ElectionsTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'gallery-management' && <GalleryManagementTab />}
        {activeTab === 'news' && <NewsTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'membership-categories' && <MembershipCategoriesTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'contact' && <ContactInfoTab />}
        {activeTab === 'site-config' && <SiteConfigTab />}
        {activeTab === 'offline-forms' && <OfflineFormsTab />}
      </div>
    </AdminLayout>
  );
}
