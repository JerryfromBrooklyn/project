import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Camera, Search, User } from 'lucide-react';

console.log('Navigation is being imported');

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/upload', label: 'Upload', icon: Camera },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/profile', label: 'Profile', icon: User },
];

const Navigation = () => {
  console.log('Navigation is rendering');
  const location = useLocation();
  console.log('Current location pathname:', location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center w-full h-full relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span
                  className={`text-xs mt-1 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    initial={false}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 