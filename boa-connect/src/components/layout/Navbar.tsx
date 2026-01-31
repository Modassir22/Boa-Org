import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Eye, LogOut, LayoutDashboard, Settings, ChevronDown, Globe, Type, Contrast, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notificationAPI } from '@/lib/api';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useFavicon } from '@/hooks/useFavicon';

export function Navbar() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const navigate = useNavigate();
  const { config } = useSiteConfig();

  // Update favicon with logo
  useFavicon(config.logo_url);

  useEffect(() => {
    loadNotifications();
    loadContactInfo();
    
    // Load user immediately on mount
    const token = localStorage.getItem('token');
    const cachedUserData = localStorage.getItem('user');
    
    
    if (cachedUserData && token) {
      try {
        const userData = JSON.parse(cachedUserData);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    // Then load fresh data
    loadUser();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadContactInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact-info`);
      const data = await response.json();
      if (data.success && data.contactInfo) {
        setContactInfo(data.contactInfo);
      }
    } catch (error) {
      console.error('Failed to load contact info:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUser = () => {
    const token = localStorage.getItem('token');
    const cachedUserData = localStorage.getItem('user');
    
    // Immediately set loading to false and load from cache if available
    if (cachedUserData && token) {
      try {
        const userData = JSON.parse(cachedUserData);
        setUser(userData);
        setIsAuthLoading(false);
      } catch (error) {
        console.error('Failed to parse cached user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsAuthLoading(false);
        return;
      }
    } else {
      // No cached data, stop loading immediately
      setIsAuthLoading(false);
      if (!token) {
        console.log('No token found in localStorage');
        return;
      }
    }
    
    // Then fetch fresh data in background if token exists
    if (token) {
      fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          console.log('Profile fetch response status:', response.status);
          if (response.ok) {
            return response.json();
          }
          // If token is invalid, clear localStorage
          if (response.status === 401) {
            console.log('Token expired or invalid');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
          if (response.status === 404) {
            console.log('Profile endpoint not found - using cached data');
            return null; // Just use cached data
          }
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        })
        .then(userData => {
          if (userData && userData.user) {
            setUser(userData.user);
            localStorage.setItem('user', JSON.stringify(userData.user));
            console.log('Profile refreshed from server');
          }
        })
        .catch(error => {
          // Silently fail - user data already loaded from localStorage
          console.log('Background profile refresh failed (non-critical):', error.message);
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const activeNotifications = notifications.filter(n => n.is_active);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadNotifications = activeNotifications.length;

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.first_name || user.name || '';
    const lastName = user.last_name || user.surname || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return 'User';
    const titleMap: any = {
      'dr': 'Dr.',
      'mr': 'Mr.',
      'mrs': 'Mrs.',
      'ms': 'Ms.',
      'prof': 'Prof.'
    };
    const displayTitle = titleMap[user.title?.toLowerCase()] || user.title || '';
    return `${displayTitle} ${user.first_name || user.name || ''} ${user.last_name || user.surname || ''}`.trim();
  };

  // Simple navigation menu items
  const navigationItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/seminars', label: 'Events' },
    { path: '/membership', label: 'Member Zone' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/contact', label: 'Contact Us' }
  ];

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-gray-800 text-gray-300 py-1.5 sm:py-2 gov-fade-in hidden sm:block" style={{ opacity: 1, visibility: 'visible' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <a
                  href={`mailto:${contactInfo?.email || 'info@boa.org.in'}`}
                  className="gov-transition-colors hover:text-white"
                >
                  {contactInfo?.email || 'info@boa.org.in'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <a
                  href={`tel:${contactInfo?.mobile || '+916121234567'}`}
                  className="gov-transition-colors hover:text-white"
                >
                  {contactInfo?.mobile || '+91 612 123 4567'}
                </a>
              </div>
            </div>
            <div className="text-xs text-gray-300 hidden lg:block">
              Government Recognized Medical Association | Est. 1975
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 w-full bg-blue-900 border-b border-blue-800 shadow-sm navbar-sticky">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              {config.logo_url ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={config.logo_url}
                    alt="BOA Logo"
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-base sm:text-lg font-semibold text-white leading-tight">
                      Bihar Ophthalmic Association
                    </span>
                    <span className="text-xs text-blue-200 hidden md:block">
                      Government Recognized Medical Association
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md bg-blue-800 border-2 border-blue-700">
                    <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-base sm:text-lg font-semibold text-white leading-tight">
                      Bihar Ophthalmic Association
                    </span>
                    <span className="text-xs text-blue-200 hidden md:block">
                      Government Recognized Medical Association
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              {navigationItems.filter(item => item.path !== '/notifications').map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-link px-3 xl:px-4 py-2 text-sm font-medium border-b-2 border-transparent gov-transition-colors ${isActive(item.path)
                      ? 'text-white border-blue-300 active'
                      : 'text-blue-100 hover:text-blue-200'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* Notifications - Separate with Indicator */}
              <Link to="/notifications" className="relative">
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md gov-transition-colors ${isActive('/notifications')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}>
                  <div className="relative">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>

                    {/* Notification Badge - Only number */}
                    {unreadNotifications > 0 && (
                      <span className="notification-badge absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-blue-900">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* User Menu or Login Buttons */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-blue-800 transition-colors">
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-orange-300">
                        <AvatarImage src={user.avatar} alt={getUserName()} />
                        <AvatarFallback className="text-xs font-semibold bg-orange-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium text-white">
                        {getUserName().split(' ')[0]}
                      </span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60" align="end">
                    <DropdownMenuLabel>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.membership_no && (
                      <>
                        <DropdownMenuItem className="cursor-default">
                          <div className="flex items-center justify-center w-full">
                            <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                              Membership: {user.membership_no}
                            </Badge>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>

                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="gov-button text-blue-100 hover:bg-blue-800 hover:text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
                      Login
                    </Button>
                  </Link>
                  <span className="text-blue-400 text-xs">|</span>
                  <Link to="/admin/login">
                    <Button variant="ghost" size="sm" className="gov-button text-blue-100 hover:bg-blue-800 hover:text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
                      Admin
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden ml-1 sm:ml-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-blue-800 h-8 w-8 sm:h-9 sm:w-9">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[300px]">
                  <div className="flex flex-col gap-1 mt-4 sm:mt-6">

                    {/* Mobile User Info */}
                    {user && (
                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 rounded-lg border">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-orange-400">
                            <AvatarImage src={user.avatar} alt={getUserName()} />
                            <AvatarFallback className="bg-orange-500 text-white font-semibold text-sm">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{getUserName()}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Notifications - Separate */}
                    <Link
                      to="/notifications"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 mb-3 sm:mb-4 text-sm font-medium rounded-lg border-2 transition-colors ${isActive('/notifications')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <svg
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          {/* Pulsing indicator for mobile */}
                          {unreadNotifications > 0 && (
                            <div className="absolute -top-1 -right-1">
                              <span className="flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm">Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <Badge className="h-5 px-2 text-xs bg-red-600 text-white font-bold border-2 border-white">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </Badge>
                      )}
                    </Link>

                    {/* Mobile Navigation */}
                    <div className="space-y-1">
                      {navigationItems.filter(item => item.path !== '/notifications').map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.path)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Mobile User Actions */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      {user ? (
                        <div className="space-y-2">
                          {user.membership_no && (
                            <div className="flex items-center justify-center mb-3">
                              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                                Membership: {user.membership_no}
                              </Badge>
                            </div>
                          )}
                          <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full justify-start text-sm h-9">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-0 text-sm h-9"
                            onClick={() => {
                              handleLogout();
                              setMobileOpen(false);
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Link to="/login" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full text-sm h-9">
                              Login
                            </Button>
                          </Link>
                          <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm h-9">
                              Admin Login
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

