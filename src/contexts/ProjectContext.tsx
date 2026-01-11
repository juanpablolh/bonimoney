import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Project {
    id: string;
    name: string;
    description?: string;
    currency: string;
    icon: string;
    slug: string;
    owner_id: string;
    view_mode: 'public' | 'private';
    share_token: string;
    created_at: string;
    updated_at: string;
}

interface ProjectContextType {
    currentProject: Project | null;
    projects: Project[];
    loading: boolean;
    setCurrentProject: (project: Project | null) => void;
    loadProjects: () => Promise<void>;
    createProject: (data: CreateProjectData) => Promise<Project>;
    updateProject: (id: string, data: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

interface CreateProjectData {
    name: string;
    description?: string;
    currency?: string;
    icon?: string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user's projects
    const loadProjects = async () => {
        if (!user) {
            setProjects([]);
            setCurrentProject(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // TODO: Replace with actual Supabase query
            // For now, return empty array
            const userProjects: Project[] = [];

            setProjects(userProjects);

            // Set current project from localStorage or first project
            const savedProjectId = localStorage.getItem('currentProjectId');
            if (savedProjectId) {
                const saved = userProjects.find(p => p.id === savedProjectId);
                if (saved) {
                    setCurrentProject(saved);
                } else if (userProjects.length > 0) {
                    setCurrentProject(userProjects[0]);
                }
            } else if (userProjects.length > 0) {
                setCurrentProject(userProjects[0]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create new project
    const createProject = async (data: CreateProjectData): Promise<Project> => {
        if (!user) throw new Error('Must be authenticated to create project');

        try {
            // TODO: Replace with actual Supabase mutation
            const newProject: Project = {
                id: Math.random().toString(36).substring(7),
                name: data.name,
                description: data.description,
                currency: data.currency || 'CLP',
                icon: data.icon || '📊',
                slug: data.name.toLowerCase().replace(/\s+/g, '-'),
                owner_id: user.id,
                view_mode: 'public',
                share_token: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setProjects(prev => [...prev, newProject]);
            setCurrentProject(newProject);
            localStorage.setItem('currentProjectId', newProject.id);

            return newProject;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    // Update project
    const updateProject = async (id: string, data: Partial<Project>) => {
        try {
            // TODO: Replace with actual Supabase mutation
            setProjects(prev =>
                prev.map(p => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p))
            );

            if (currentProject?.id === id) {
                setCurrentProject(prev => prev ? { ...prev, ...data } : null);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    // Delete project
    const deleteProject = async (id: string) => {
        try {
            // TODO: Replace with actual Supabase mutation
            setProjects(prev => prev.filter(p => p.id !== id));

            if (currentProject?.id === id) {
                const remaining = projects.filter(p => p.id !== id);
                setCurrentProject(remaining.length > 0 ? remaining[0] : null);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    // Load projects when user changes
    useEffect(() => {
        loadProjects();
    }, [user]);

    // Save current project to localStorage
    useEffect(() => {
        if (currentProject) {
            localStorage.setItem('currentProjectId', currentProject.id);
        }
    }, [currentProject]);

    return (
        <ProjectContext.Provider
            value={{
                currentProject,
                projects,
                loading,
                setCurrentProject,
                loadProjects,
                createProject,
                updateProject,
                deleteProject,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
