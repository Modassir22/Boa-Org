import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Eye, LogOut, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function Navbar() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { config } = useSiteConfig();

  // Theme Colors Configuration
  const theme = {
    primary: '#0F4C75',    // Deep Royal Blue (Trust)
    secondary: '#3282B8',  // Teal Blue (Vision/Medical)
    accent: '#E94560',     // Alert Red (Notices)
    textLight: '#BBE1FA',  // Light Blue Text
  };

  useEffect(() => {
    loadNotifications();
    loadUser();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
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

  return (
    <header 
      className="sticky top-0 z-50 w-full shadow-lg transition-all duration-300" 
      style={{
        background: `linear-gradient(to right, ${theme.primary}, #1B262C)`,
        borderBottom: `3px solid ${theme.secondary}`
      }}
    >
      <div className="container flex h-20 items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          {config.logo_url ? (
            <img 
              src={config.logo_url} 
              alt="BOA Logo" 
              className="h-14 w-auto object-contain drop-shadow-md"
            />
          ) : (
            <>
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-transform group-hover:scale-105"
              >
                <Eye className="h-7 w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-wide leading-tight">BOA</span>
                <span className="text-xs font-medium tracking-wider" style={{ color: theme.secondary }}>
                  Bihar Ophthalmic Association
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { path: '/', label: 'Home' },
            { path: '/about', label: 'About' }
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-white shadow-md transform -translate-y-0.5'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={isActive(link.path) ? { backgroundColor: theme.secondary } : {}}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Events Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isActive('/seminars') || isActive('/cme-programs')
                    ? 'text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                style={isActive('/seminars') || isActive('/cme-programs') ? { backgroundColor: theme.secondary } : {}}
              >
                Events
                <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white border-t-2" style={{ borderTopColor: theme.secondary }}>
              <DropdownMenuItem asChild className="focus:bg-slate-100">
                <Link to="/seminars" className="cursor-pointer font-medium text-slate-700">
                  Seminars & Conferences
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {[
            { path: '/membership', label: 'Membership' },
            { path: '/resources', label: 'Resources' },
            { path: '/gallery', label: 'Gallery' },
            { path: '/contact', label: 'Contact' }
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-white shadow-md transform -translate-y-0.5'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={isActive(link.path) ? { backgroundColor: theme.secondary } : {}}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications - Show on mobile too */}
          <Link to="/notifications" className="lg:block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="hidden sm:inline text-sm font-medium mr-2">Notice</span>
              <span className="sm:hidden text-sm font-medium">Notice</span>
              {unreadNotifications > 0 && (
                <>
                  <Badge 
                    className="ml-1 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white border-0" 
                    style={{ backgroundColor: theme.accent }}
                  >
                    {unreadNotifications}
                  </Badge>
                  {/* Pulsing dot indicator */}
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.accent }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: theme.accent }}></span>
                  </span>
                </>
              )}
            </Button>
          </Link>

          {/* User Menu - Desktop */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 p-1">
                    <Avatar className="h-9 w-9 border-2" style={{ borderColor: theme.secondary }}>
                      <AvatarImage src={user.avatar} alt={getUserName()} />
                      <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: theme.secondary }}>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 p-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 bg-slate-50 p-2 rounded-md">
                      <p className="text-sm font-semibold text-slate-800">{getUserName()}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.membership_no && (
                        <div className="mt-1">
                           <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700">
                             ID: {user.membership_no}
                           </Badge>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer focus:bg-slate-100">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-slate-600" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer focus:bg-slate-100">
                      <Settings className="mr-2 h-4 w-4 text-slate-600" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    size="sm" 
                    className="text-white font-medium shadow-lg hover:shadow-xl transition-all" 
                    style={{ backgroundColor: theme.secondary }}
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-4" style={{ borderLeftColor: theme.primary }}>
              <div className="flex flex-col gap-1 mt-6">
                {user && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
                      <Avatar className="h-12 w-12 border-2" style={{ borderColor: theme.primary }}>
                        <AvatarImage src={user.avatar} alt={getUserName()} />
                        <AvatarFallback className="text-white" style={{ backgroundColor: theme.primary }}>
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{getUserName()}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center ${
                      isActive('/') ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    style={isActive('/') ? { color: theme.primary } : { color: '#64748b' }}
                  >
                    Home
                  </Link>

                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
                    Events & Updates
                  </div>
                  
                  <Link
                    to="/seminars"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center ${
                      isActive('/seminars') ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    style={isActive('/seminars') ? { color: theme.primary } : { color: '#64748b' }}
                  >
                    Seminars
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                      isActive('/notifications') ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    style={isActive('/notifications') ? { color: theme.primary } : { color: '#64748b' }}
                  >
                    <span>Notice</span>
                    {unreadNotifications > 0 && (
                      <Badge 
                        className="h-5 px-2 flex items-center justify-center text-xs text-white border-0" 
                        style={{ backgroundColor: theme.accent }}
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Link>

                   <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
                    Association
                  </div>

                  <Link
                    to="/membership"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center ${
                      isActive('/membership') ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    style={isActive('/membership') ? { color: theme.primary } : { color: '#64748b' }}
                  >
                    Membership
                  </Link>

                   <Link
                    to="/about"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center ${
                      isActive('/about') ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    style={isActive('/about') ? { color: theme.primary } : { color: '#64748b' }}
                  >
                    About Us
                  </Link>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  {user ? (
                    <div className="space-y-2">
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-700">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-0"
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
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full border-slate-200">
                          Login
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full text-white" style={{ backgroundColor: theme.secondary }}>
                          Register
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
    </header>
  );
}

