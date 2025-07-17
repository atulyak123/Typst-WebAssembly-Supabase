'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Grid, List, Settings, HelpCircle, FileText, Users, Home, BarChart, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";


interface DashboardProps {
  user: User;
  signOut: () => Promise<void>;
}
export default function Dashboard({ user, signOut }: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projects] = useState([
    { id: 1, name: 'Research Paper', lastModified: '2 hours ago', thumbnail: '📄' },
    { id: 2, name: 'Resume', lastModified: '1 day ago', thumbnail: '📝' },
    { id: 3, name: 'Project Report', lastModified: '3 days ago', thumbnail: '📊' },
    { id: 4, name: 'Letter', lastModified: '1 week ago', thumbnail: '✉️' },
  ]);

  const [sharedProjects] = useState([
    { id: 1, name: 'Team Proposal', owner: 'John Doe', thumbnail: '📋' },
    { id: 2, name: 'Meeting Notes', owner: 'Jane Smith', thumbnail: '📝' },
  ]);
  const router = useRouter();

  const handleNavigateToEditor = () => {
    router.push('/editor');
  };
   const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Extract user's name from email or metadata
  const getUserName = () => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    
    // Extract name from email (e.g., "john.doe@infocusp.com" -> "John Doe")
    const emailName = user.email?.split('@')[0];
    if (emailName) {
      return emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    return 'User';
  };
  return (
    <div className="flex overflow-auto h-screen bg-slate-50">
      {/* Left Sidebar */}
      <aside className="w-16 border-r bg-white flex flex-col items-center py-4 space-y-6">
        {/* Logo */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col items-center space-y-4">
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 bg-blue-50 text-blue-600">
            <Home className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
            <BarChart className="w-4 h-4" />
          </Button>
        </nav>

        {/* Bottom items */}
        <div className="flex-1 flex flex-col justify-end space-y-4">
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-10 h-10 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, {getUserName()}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Search in projects" 
                className="pl-10 w-80" 
              />
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            
            {/* User Avatar and Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{getUserName()}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {getUserName().charAt(0).toUpperCase()}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-slate-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Create New Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="border-dashed border-2 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
            onClick={handleNavigateToEditor}
          >
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900 mb-2">Empty document</h3>
              <p className="text-sm text-slate-500">Start from scratch</p>
            </CardContent>
          </Card>
        </div>

        {/* My Projects Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-900">My Projects</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">sort by</span>
              <Button variant="outline" size="sm" className="text-xs">
                last modified
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'}`}>
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">{project.thumbnail}</span>
                  </div>
                  <h3 className="font-medium text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500">{project.lastModified}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shared with Me Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900">Shared with me</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sharedProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">{project.thumbnail}</span>
                  </div>
                  <h3 className="font-medium text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500">{project.owner}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Shared
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}