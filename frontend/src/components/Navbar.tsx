"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import authService, { UserProfile } from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const checkAuth = async () => {
    const isAuth = authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      try {
        const profile = await authService.getCurrentUser();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    } else {
      setUserProfile(null);
    }
  };
  
  // Check auth state whenever the component renders and set up event listeners
  useEffect(() => {
    checkAuth();
    
    // Set up event listener for auth changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        checkAuth();
      }
    });
    
    // Custom event for auth changes within the same window
    window.addEventListener('auth-changed', checkAuth);
    
    return () => {
      window.removeEventListener('storage', () => {});
      window.removeEventListener('auth-changed', checkAuth);
    };
  }, []);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and site name */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Value Compass</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Dashboard
            </Link>
            <Link href="/stocks" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Stocks
            </Link>
            <Link href="/portfolios" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Portfolios
            </Link>
            <Link href="/baskets" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Baskets
            </Link>
            <Link href="/reports" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Reports
            </Link>
            <Link href="/alerts" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Alerts
            </Link>
          </div>

          {/* User menu - Desktop */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : userProfile?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span>{userProfile?.full_name || userProfile?.username}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Your Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 mr-2">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            <Link href="/dashboard" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Dashboard
            </Link>
            <Link href="/stocks" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Stocks
            </Link>
            <Link href="/portfolios" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Portfolios
            </Link>
            <Link href="/baskets" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Baskets
            </Link>
            <Link href="/reports" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Reports
            </Link>
            <Link href="/alerts" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
              Alerts
            </Link>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
                      {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : userProfile?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{userProfile?.full_name || userProfile?.username}</span>
                  </div>
                  <Link href="/profile" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
                    Your Profile
                  </Link>
                  <Link href="/settings" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
                    Sign In
                  </Link>
                  <Link href="/signup" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
