import React from 'react';
import { motion } from 'framer-motion';
import { AppleCard } from './ui/AppleCard';
import { AppleButton } from './ui/AppleButton';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  DocumentTextIcon,
  InboxIcon,
  BellIcon,
  CogIcon,
  SearchIcon
} from '@heroicons/react/outline';

const AppleDashboard: React.FC = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-apple-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-apple-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-apple-md bg-apple-blue flex items-center justify-center text-white text-xl font-medium mr-3">
              A
            </div>
            <h1 className="text-xl font-medium text-apple-gray-900">Apple Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-apple-gray-100 border-none rounded-apple-full pl-10 pr-4 py-2 text-sm focus:ring-apple-blue focus:ring-2 focus:outline-none transition-all"
              />
              <SearchIcon className="h-5 w-5 text-apple-gray-500 absolute left-3 top-2" />
            </div>
            
            <button className="p-2 rounded-full hover:bg-apple-gray-100 transition-colors relative">
              <BellIcon className="h-6 w-6 text-apple-gray-600" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-apple-blue rounded-full"></span>
            </button>
            
            <button className="p-2 rounded-full hover:bg-apple-gray-100 transition-colors">
              <CogIcon className="h-6 w-6 text-apple-gray-600" />
            </button>
            
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-apple-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              JS
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-apple-gray-900 mb-1">Welcome back, John</h2>
          <p className="text-apple-gray-600">Here's what's happening with your projects today.</p>
        </div>
        
        {/* Stats overview */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((card, index) => (
            <motion.div key={card.title} variants={item} custom={index}>
              <AppleCard padding="md" className="h-full">
                <div className="flex items-start">
                  <div className={`p-3 rounded-apple-md ${card.bgColor} ${card.textColor} mr-4`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-apple-gray-500 text-sm font-medium mb-1">{card.title}</p>
                    <h3 className="text-2xl font-medium">{card.value}</h3>
                    <p className={`text-xs font-medium flex items-center mt-1 ${card.trendColor}`}>
                      {card.trend}
                      <span className="text-apple-gray-500 ml-1">vs. last month</span>
                    </p>
                  </div>
                </div>
              </AppleCard>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Main dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <AppleCard padding="md" className="h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Activity Overview</h3>
                <select className="bg-apple-gray-100 border-none rounded-apple-md px-3 py-1.5 text-sm focus:ring-apple-blue focus:ring-2 focus:outline-none">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="h-72 flex items-center justify-center">
                <p className="text-apple-gray-500">Chart visualization would go here</p>
              </div>
            </AppleCard>
          </motion.div>
          
          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AppleCard padding="md" className="h-full">
              <h3 className="text-lg font-medium mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`h-10 w-10 rounded-apple-md ${activity.bgColor} flex items-center justify-center mr-3 flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-apple-gray-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <AppleButton variant="secondary" className="w-full mt-4 text-sm">
                View All Activity
              </AppleButton>
            </AppleCard>
          </motion.div>
        </div>
        
        {/* Recent projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AppleCard padding="md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Recent Projects</h3>
              <AppleButton variant="primary" size="sm">
                New Project
              </AppleButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-apple-gray-200">
                    <th className="text-left py-3 px-4 text-apple-gray-500 font-medium text-sm">Project Name</th>
                    <th className="text-left py-3 px-4 text-apple-gray-500 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-apple-gray-500 font-medium text-sm">Members</th>
                    <th className="text-left py-3 px-4 text-apple-gray-500 font-medium text-sm">Completion</th>
                    <th className="text-left py-3 px-4 text-apple-gray-500 font-medium text-sm">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => (
                    <tr key={index} className="border-b border-apple-gray-200 hover:bg-apple-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-apple-md ${project.bgColor} flex items-center justify-center mr-3`}>
                            {project.icon}
                          </div>
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-apple-full text-xs font-medium ${project.statusBg} ${project.statusText}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center -space-x-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-7 w-7 rounded-full bg-apple-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-apple-gray-200 rounded-apple-full h-2">
                          <div
                            className={`h-2 rounded-apple-full ${project.progressColor}`}
                            style={{ width: `${project.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-apple-gray-500 mt-1">{project.completion}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-apple-gray-500">{project.dueDate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AppleCard>
        </motion.div>
      </main>
    </div>
  );
};

// Sample data
const statCards = [
  {
    title: 'Total Revenue',
    value: '$24,560',
    trend: '+4.75%',
    trendColor: 'text-green-500',
    icon: <ChartBarIcon className="h-6 w-6" />,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    title: 'Active Users',
    value: '2,450',
    trend: '+12.2%',
    trendColor: 'text-green-500',
    icon: <UserGroupIcon className="h-6 w-6" />,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    title: 'New Transactions',
    value: '1,280',
    trend: '+8.12%',
    trendColor: 'text-green-500',
    icon: <CreditCardIcon className="h-6 w-6" />,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  {
    title: 'Pending Reports',
    value: '4',
    trend: '-2.33%',
    trendColor: 'text-red-500',
    icon: <DocumentTextIcon className="h-6 w-6" />,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
];

const recentActivity = [
  {
    title: 'New user registered',
    time: '3 minutes ago',
    icon: <UserGroupIcon className="h-5 w-5 text-blue-500" />,
    bgColor: 'bg-blue-100',
  },
  {
    title: 'New order placed',
    time: '1 hour ago',
    icon: <CreditCardIcon className="h-5 w-5 text-green-500" />,
    bgColor: 'bg-green-100',
  },
  {
    title: 'Customer sent a message',
    time: '2 hours ago',
    icon: <InboxIcon className="h-5 w-5 text-purple-500" />,
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Server maintenance completed',
    time: 'Yesterday',
    icon: <CogIcon className="h-5 w-5 text-amber-500" />,
    bgColor: 'bg-amber-100',
  },
];

const projects = [
  {
    name: 'iOS App Redesign',
    status: 'In Progress',
    statusBg: 'bg-blue-100',
    statusText: 'text-blue-700',
    completion: 75,
    progressColor: 'bg-blue-500',
    dueDate: 'Aug 15, 2023',
    bgColor: 'bg-blue-100',
    icon: <DocumentTextIcon className="h-4 w-4 text-blue-600" />,
  },
  {
    name: 'Marketing Website',
    status: 'Completed',
    statusBg: 'bg-green-100',
    statusText: 'text-green-700',
    completion: 100,
    progressColor: 'bg-green-500',
    dueDate: 'Jul 22, 2023',
    bgColor: 'bg-green-100',
    icon: <DocumentTextIcon className="h-4 w-4 text-green-600" />,
  },
  {
    name: 'Customer Portal',
    status: 'Planning',
    statusBg: 'bg-amber-100',
    statusText: 'text-amber-700',
    completion: 20,
    progressColor: 'bg-amber-500',
    dueDate: 'Sep 30, 2023',
    bgColor: 'bg-amber-100',
    icon: <DocumentTextIcon className="h-4 w-4 text-amber-600" />,
  },
];

export default AppleDashboard; 