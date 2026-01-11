import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

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

    // Load user's projects from Supabase
    const loadProjects = async () => {
        if (!user) {
            setProjects([]);
            setCurrentProject(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Query projects where user is a member
            const { data: projectsData, error } = await supabase
                .from('projects')
                .select(`
          *,
          project_members!inner(user_id, status)
        `)
                .eq('project_members.user_id', user.id)
                .eq('project_members.status', 'accepted')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error loading projects:', error);
                throw error;
            }

            const userProjects = projectsData || [];
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
            // Generate short ID (8 characters, alphanumeric)
            const generateId = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let id = '';
                for (let i = 0; i < 8; i++) {
                    id += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return id;
            };

            const projectId = generateId();

            // 1. Create project
            const { data: newProject, error: projectError } = await supabase
                .from('projects')
                .insert({
                    id: projectId,
                    name: data.name,
                    description: data.description,
                    currency: data.currency || 'CLP',
                    icon: data.icon || '📊',
                    owner_id: user.id,
                    view_mode: 'public',
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // 2. Add creator as owner in project_members
            const { error: memberError } = await supabase
                .from('project_members')
                .insert({
                    project_id: newProject.id,
                    user_id: user.id,
                    role: 'owner',
                    status: 'accepted',
                    joined_at: new Date().toISOString(),
                });

            if (memberError) throw memberError;

            // 3. Add to user_projects for quick access
            const { error: userProjectError } = await supabase
                .from('user_projects')
                .insert({
                    user_id: user.id,
                    project_id: newProject.id,
                    last_accessed_at: new Date().toISOString(),
                });

            if (userProjectError) throw userProjectError;

            // Update local state
            setProjects(prev => [newProject, ...prev]);
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
            const { error } = await supabase
                .from('projects')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            // Update local state
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

    // Delete project (soft delete - archive)
    const deleteProject = async (id: string) => {
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    archived: true,
                    archived_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            // Update local state
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

    // Save current project to localStorage and update last_accessed_at
    useEffect(() => {
        if (currentProject && user) {
            localStorage.setItem('currentProjectId', currentProject.id);

            // Update last_accessed_at in background
            supabase
                .from('user_projects')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('project_id', currentProject.id)
                .then(({ error }) => {
                    if (error) console.error('Error updating last_accessed_at:', error);
                });
        }
    }, [currentProject, user]);

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
