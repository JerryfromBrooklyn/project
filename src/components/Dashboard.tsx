import React from 'react';
import { AppleCard, AppleCardHeader, AppleCardTitle, AppleCardContent } from './ui/AppleCard';
import { AppleButton } from './ui/AppleButton';

// Mock data
const recentActivity = [
  { id: 1, action: "File uploaded", target: "presentation.pdf", date: "10 minutes ago" },
  { id: 2, action: "Comment added", target: "Project proposal", date: "1 hour ago" },
  { id: 3, action: "Task completed", target: "Design review", date: "3 hours ago" },
  { id: 4, action: "Meeting scheduled", target: "Team sync", date: "Yesterday" },
];

const projects = [
  { id: 1, name: "Marketing Campaign", progress: 75, status: "In Progress" },
  { id: 2, name: "Website Redesign", progress: 90, status: "Final Review" },
  { id: 3, name: "Mobile App Development", progress: 30, status: "In Progress" },
  { id: 4, name: "Brand Guidelines", progress: 100, status: "Completed" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-900 pt-16">
      <main className="container mx-auto px-6 py-8">
        <header className="mb-12">
          <h1 className="text-3xl font-medium text-apple-gray-900 dark:text-white tracking-tight">
            Welcome back, User
          </h1>
          <p className="text-apple-gray-600 dark:text-apple-gray-300 mt-2">
            Here's what's happening with your projects today.
          </p>
        </header>
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AppleCard className="bg-apple-blue/10 dark:bg-apple-blue/5">
                <AppleCardContent>
                  <div className="text-apple-blue text-2xl font-semibold">12</div>
                  <div className="text-apple-gray-600 dark:text-apple-gray-400 text-sm">Active Projects</div>
                </AppleCardContent>
              </AppleCard>
              
              <AppleCard className="bg-apple-green/10 dark:bg-apple-green/5">
                <AppleCardContent>
                  <div className="text-apple-green text-2xl font-semibold">85%</div>
                  <div className="text-apple-gray-600 dark:text-apple-gray-400 text-sm">Task Completion</div>
                </AppleCardContent>
              </AppleCard>
              
              <AppleCard className="bg-apple-orange/10 dark:bg-apple-orange/5">
                <AppleCardContent>
                  <div className="text-apple-orange text-2xl font-semibold">7</div>
                  <div className="text-apple-gray-600 dark:text-apple-gray-400 text-sm">Pending Reviews</div>
                </AppleCardContent>
              </AppleCard>
              
              <AppleCard className="bg-apple-purple/10 dark:bg-apple-purple/5">
                <AppleCardContent>
                  <div className="text-apple-purple text-2xl font-semibold">3</div>
                  <div className="text-apple-gray-600 dark:text-apple-gray-400 text-sm">Team Meetings</div>
                </AppleCardContent>
              </AppleCard>
            </div>
            
            {/* Projects */}
            <AppleCard frosted>
              <AppleCardHeader>
                <div className="flex justify-between items-center">
                  <AppleCardTitle>Current Projects</AppleCardTitle>
                  <AppleButton variant="ghost" size="sm">View All</AppleButton>
                </div>
              </AppleCardHeader>
              <AppleCardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-apple-gray-900 dark:text-white">{project.name}</h4>
                        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{project.status}</p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-apple-gray-200 dark:bg-apple-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              project.progress === 100 
                                ? 'bg-apple-green' 
                                : project.progress > 60 
                                  ? 'bg-apple-blue' 
                                  : 'bg-apple-orange'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-right mt-1 text-apple-gray-500 dark:text-apple-gray-400">
                          {project.progress}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AppleCardContent>
            </AppleCard>
            
            {/* Calendar Section */}
            <AppleCard>
              <AppleCardHeader>
                <div className="flex justify-between items-center">
                  <AppleCardTitle>Upcoming Schedule</AppleCardTitle>
                  <AppleButton variant="ghost" size="sm">View Calendar</AppleButton>
                </div>
              </AppleCardHeader>
              <AppleCardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-apple bg-apple-blue/5 border border-apple-blue/10">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-apple-gray-900 dark:text-white">Team Weekly Sync</h4>
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">10:00 AM - 11:00 AM</p>
                      </div>
                      <span className="text-apple-blue text-xs font-medium bg-apple-blue/10 px-2 py-1 rounded-full">Today</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-apple-gray-900 dark:text-white">Design Review</h4>
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">2:00 PM - 3:30 PM</p>
                      </div>
                      <span className="text-apple-gray-600 dark:text-apple-gray-400 text-xs font-medium bg-apple-gray-200 dark:bg-apple-gray-700 px-2 py-1 rounded-full">Tomorrow</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-apple-gray-900 dark:text-white">Client Presentation</h4>
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">11:30 AM - 1:00 PM</p>
                      </div>
                      <span className="text-apple-gray-600 dark:text-apple-gray-400 text-xs font-medium bg-apple-gray-200 dark:bg-apple-gray-700 px-2 py-1 rounded-full">Wed, Jun 15</span>
                    </div>
                  </div>
                </div>
              </AppleCardContent>
            </AppleCard>
          </div>
          
          {/* Sidebar - 1/3 width */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <AppleCard>
              <AppleCardHeader>
                <AppleCardTitle>Recent Activity</AppleCardTitle>
              </AppleCardHeader>
              <AppleCardContent>
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="bg-apple-gray-100 dark:bg-apple-gray-800 rounded-full p-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-apple-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-apple-gray-900 dark:text-white">
                          <span className="font-medium">{item.action}</span> - {item.target}
                        </p>
                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AppleCardContent>
            </AppleCard>
            
            {/* Quick Actions */}
            <AppleCard frosted>
              <AppleCardHeader>
                <AppleCardTitle>Quick Actions</AppleCardTitle>
              </AppleCardHeader>
              <AppleCardContent>
                <div className="space-y-3">
                  <AppleButton width="full" variant="primary">New Project</AppleButton>
                  <AppleButton width="full" variant="secondary">Upload Files</AppleButton>
                  <AppleButton width="full" variant="outline">Schedule Meeting</AppleButton>
                  <AppleButton width="full" variant="ghost">View Reports</AppleButton>
                </div>
              </AppleCardContent>
            </AppleCard>
            
            {/* Team Section */}
            <AppleCard>
              <AppleCardHeader>
                <div className="flex justify-between items-center">
                  <AppleCardTitle>Team Members</AppleCardTitle>
                  <AppleButton variant="ghost" size="sm">View All</AppleButton>
                </div>
              </AppleCardHeader>
              <AppleCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue font-medium">AJ</div>
                    <div>
                      <p className="text-sm font-medium text-apple-gray-900 dark:text-white">Alex Johnson</p>
                      <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Product Manager</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-apple-green/10 flex items-center justify-center text-apple-green font-medium">ML</div>
                    <div>
                      <p className="text-sm font-medium text-apple-gray-900 dark:text-white">Maria Liu</p>
                      <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">UX Designer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-apple-purple/10 flex items-center justify-center text-apple-purple font-medium">RK</div>
                    <div>
                      <p className="text-sm font-medium text-apple-gray-900 dark:text-white">Robert Kim</p>
                      <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Developer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-apple-orange/10 flex items-center justify-center text-apple-orange font-medium">SB</div>
                    <div>
                      <p className="text-sm font-medium text-apple-gray-900 dark:text-white">Sarah Brown</p>
                      <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Marketing</p>
                    </div>
                  </div>
                </div>
              </AppleCardContent>
            </AppleCard>
          </div>
        </div>
      </main>
    </div>
  );
} 