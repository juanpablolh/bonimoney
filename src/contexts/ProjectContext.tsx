import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

export interface Project {
    id: string;
    name: string;
    description?: string;
    currency: string;
    icon: string;
    color?: string;
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
    color?: string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user's projects from Supabase
    const loadProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setCurrentProject(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Use RPC function to get projects (bypasses RLS issues)
            const { data: projectsData, error } = await supabase.rpc('get_my_projects');

            if (error) {
                setProjects([]);
                return;
            }

            if (!projectsData || projectsData.length === 0) {
                setProjects([]);
                return;
            }

            // Map RPC result to Project type
            const userProjects = projectsData.map((p: any) => ({
                ...p,
                memberCount: p.member_count || 1
            }));

            setProjects(userProjects);
        } catch {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Create new project
    const createProject = async (data: CreateProjectData): Promise<Project> => {
        if (!user) throw new Error('Must be authenticated to create project');

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
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario', // Added name
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
    };

    // Update project
    const updateProject = async (id: string, data: Partial<Project>) => {
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
    };

    // Delete project (soft delete - archive)
    const deleteProject = async (id: string) => {
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
            setCurrentProject(null);
            localStorage.removeItem('currentProjectId');
        }
    };

    // Load projects when user changes
    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Update last_accessed_at when currentProject changes
    useEffect(() => {
        if (currentProject && user) {
            // Update last_accessed_at in background (no localStorage)
            supabase
                .from('user_projects')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('project_id', currentProject.id)
                .then(() => { /* Silent update */ });
        }
    }, [currentProject, user]);

    // Subscribe to real-time changes for projects and project members
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('user-projects')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects'
                },
                () => {
                    loadProjects();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_members'
                },
                () => {
                    loadProjects();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]); // Removed loadProjects from dependencies

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
