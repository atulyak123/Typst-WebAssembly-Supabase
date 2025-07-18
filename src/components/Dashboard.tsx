"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Grid,
  Settings,
  HelpCircle,
  FileText,
  Users,
  Home,
  BarChart,
  LogOut,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  fetchUserProjects,
  createNewProject,
  deleteProject,
  checkStorageAccess,
  type Project,
} from "@/lib/projectService";

interface DashboardProps {
  user: User;
  signOut: () => Promise<void>;
}

export default function Dashboard({ user, signOut }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // Load projects on component mount
  useEffect(() => {
    initializeDashboard();
  }, []);

  // Auto-refresh projects when the page becomes visible (user returns from editor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProjects();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check storage access
      const storageOK = await checkStorageAccess();
      if (!storageOK) {
        setError(
          "Storage access failed. Please check your Supabase configuration.",
        );
        return;
      }

      // Load projects
      await loadProjects();
    } catch (err) {
      console.error("Dashboard initialization failed:", err);
      setError("Failed to initialize dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const userProjects = await fetchUserProjects();
      setProjects(userProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects");
    }
  };

  const handleCreateNewDocument = async () => {
    if (isCreating) return;

    const title = prompt(
      "What would you like to name your document?",
      "My New Document",
    );
    if (!title || !title.trim()) return;

    try {
      setIsCreating(true);
      const newProject = await createNewProject(user.id, title.trim());

      // Add to projects list
      setProjects((prev) => [newProject, ...prev]);

      // Navigate to editor
      router.push(`/editor/${newProject.id}`);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Failed to create document:", err.message);
        alert(`Failed to create document: ${err.message}`);
      } else {
        console.error("Unknown error:", err);
        alert("Failed to create document due to unknown error.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, typPath: string) => {
    if (!confirm("Delete this project forever? This action cannot be undone."))
      return;

    try {
      await deleteProject(projectId, typPath);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Failed to delete document:", err.message);
        alert(`Failed to delete document: ${err.message}`);
      } else {
        console.error("Unknown error:", err);
        alert("Failed to delete document due to unknown error.");
      }
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signOut();
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
      }
    }
  };

  const getUserName = () => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }

    const emailName = user.email?.split("@")[0];
    if (emailName) {
      return emailName
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }

    return "User";
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - then.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex overflow-auto h-screen bg-slate-50">
      {/* Left Sidebar */}
      <aside className="w-16 border-r bg-white flex flex-col items-center py-4 space-y-6">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>

        <nav className="flex flex-col items-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 bg-blue-50 text-blue-600"
          >
            <Home className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700"
          >
            <BarChart className="w-4 h-4" />
          </Button>
        </nav>

        <div className="flex-1 flex flex-col justify-end space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-slate-500 hover:text-slate-700"
          >
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
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, {getUserName()}!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search in projects"
                className="pl-10 w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNewDocument}
              disabled={isCreating}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Creating..." : "New Project"}
            </Button>

            {/* User Avatar and Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {getUserName()}
                </p>
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
                title="Sign Out"
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
            onClick={handleCreateNewDocument}
          >
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900 mb-2">
                Empty document
              </h3>
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
                variant="ghost"
                size="sm"
                onClick={loadProjects}
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button variant="default" size="sm">
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Projects Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading your projects...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={initializeDashboard} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-slate-400 text-4xl mb-4">📄</div>
                <p className="text-slate-600 mb-2">
                  {searchQuery ? "No projects found" : "No projects yet"}
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first document to get started"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateNewDocument}
                    disabled={isCreating}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={"grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6"}
            >
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  <CardContent className="p-4 relative">
                    <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h3 className="font-medium text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatTimeAgo(project.updated_at)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.typ_path);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Shared with Me Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900">Shared with me</h2>
          {/* Empty state for shared projects */}
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-slate-400 text-4xl mb-4">👥</div>
              <p className="text-slate-600 mb-2">No shared projects yet</p>
              <p className="text-slate-500 text-sm">
                Projects shared by colleagues will appear here
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
