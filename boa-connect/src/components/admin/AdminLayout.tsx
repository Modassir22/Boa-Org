import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  FileText, 
  Users, 
  Bell, 
  Menu, 
  X, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart,
  User,
  UserPlus,
  Award,
  Image,
  Phone,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { API_BASE_URL } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminLayout({ children, activeTab = 'statistics', onTabChange }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'Overview': true,
    'Seminar Management': true,
    'User Management': true,
    'Financial': true,
    'Content Management': true,
    'Membership': true,
    'Settings': true,
  });

  useEffect(() => {
    // Notifications disabled for admin panel
    // loadNotifications();
    // const interval = setInterval(loadNotifications, 30000);
    // return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/admin/activity`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.notifications) {
        // Transform notifications to include read status and time
        const transformedNotifications = data.notifications.map((notif: any) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          time: getTimeAgo(notif.created_at),
          read: notif.is_read === 1,
          seminar_id: notif.seminar_id,
          type: notif.type
        }));
        
        setNotifications(transformedNotifications);
        // Count only unread notifications
        setUnreadCount(transformedNotifications.filter((n: any) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin-login');
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    try {
      await fetch(`${API_BASE_URL}/api/notifications/admin/${notif.id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      // Navigate based on notification type
      if (notif.message.includes('registered for') || notif.message.includes('Registration')) {
        onTabChange?.('registrations');
      } else if (notif.message.includes('joined the platform') || notif.message.includes('User')) {
        onTabChange?.('users');
      } else if (notif.message.includes('Payment')) {
        onTabChange?.('registrations');
      }
      
      // Reload notifications
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: number) => {
    e.stopPropagation();
    
    try {
      await fetch(`${API_BASE_URL}/api/notifications/admin/${notifId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      // Reload notifications
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { id: 'statistics', label: 'Statistics', icon: BarChart },
      ]
    },
    {
      title: 'Seminar Management',
      items: [
        { id: 'seminars', label: 'Seminars', icon: Calendar },
        { id: 'fees', label: 'Fee Structure', icon: DollarSign },
        { id: 'registrations', label: 'Registrations', icon: FileText },
        { id: 'certification', label: 'Certification', icon: Award },
      ]
    },
    {
      title: 'User Management',
      items: [
        { id: 'users', label: 'Online Users', icon: Users },
        { id: 'offline-users', label: 'Offline Users', icon: UserPlus },
        { id: 'membership-management', label: 'Membership Management', icon: Award },
      ]
    },
    {
      title: 'Financial',
      items: [
        { id: 'all-payments', label: 'All Payments', icon: DollarSign },
      ]
    },
    {
      title: 'Content Management',
      items: [
        { id: 'upcoming', label: 'Upcoming Events', icon: Image },
        { id: 'gallery', label: 'Gallery', icon: Image },
        { id: 'testimonials', label: 'Testimonials', icon: Award },
        { id: 'committee', label: 'Committee', icon: User },
        { id: 'resources', label: 'Resources', icon: FileText },
      ]
    },
    {
      title: 'Membership',
      items: [
        { id: 'membership-categories', label: 'Membership Plans', icon: Award },
        { id: 'offline-forms', label: 'Offline Forms', icon: FileText },
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: 'contact', label: 'Contact Info', icon: Phone },
        { id: 'site-config', label: 'Site Config', icon: Settings },
      ]
    },
  ];

  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/admin" className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">BOA Admin</span>
            </Link>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center gap-3">
            {/* Notifications - Hidden for Admin */}
            <div style={{display: 'none'}}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b hover:bg-accent cursor-pointer transition-colors ${!notif.read ? 'bg-accent/50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => handleDeleteNotification(e, notif.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" className="w-full text-sm">
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>

            {/* Admin Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {admin.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="hidden md:inline font-medium">{admin.username || 'Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2 border-b">
                  <p className="font-semibold">{admin.full_name || admin.username}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                  <Badge className="mt-1 text-xs">{admin.role}</Badge>
                </div>
                <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-card border-r border-border transition-all duration-300 z-40 overflow-y-auto ${
          isSidebarOpen ? 'w-64' : 'w-16'
        } hidden lg:block`}
      >
        <nav className="p-2 space-y-2">
          {menuSections.map((section, sectionIndex) => {
            const isExpanded = expandedSections[section.title];
            return (
              <div key={sectionIndex}>
                {isSidebarOpen ? (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <div className="h-1 bg-border rounded my-2" />
                )}
                
                {(isSidebarOpen ? isExpanded : true) && (
                  <div className="space-y-1 mt-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onTabChange?.(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                          title={!isSidebarOpen ? item.label : undefined}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-background z-40 lg:hidden overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuSections.map((section, sectionIndex) => {
              const isExpanded = expandedSections[section.title];
              return (
                <div key={sectionIndex}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-2 mt-2">
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onTabChange?.(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {sectionIndex < menuSections.length - 1 && (
                    <div className="my-3 border-t border-border" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
