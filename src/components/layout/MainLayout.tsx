import { ReactNode } from 'react';
import { motion } from 'framer-motion';

console.log('MainLayout is being imported');

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  console.log('MainLayout is rendering');
  console.log('Children passed to MainLayout:', children ? 'exists' : 'none');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <main className="rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
};

export default MainLayout; 