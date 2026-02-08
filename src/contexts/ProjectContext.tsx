import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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

            // Deduplicate projects to prevent race conditions with local state
            setProjects(prev => {
                const newProjectIds = new Set(userProjects.map((p: Project) => p.id));
                const existingNotInNew = prev.filter(p => !newProjectIds.has(p.id));
                // Prefer the fetched data but keep any locally-added projects not yet in DB
                return [...userProjects, ...existingNotInNew];
            });
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

        // Skip realtime reloads for a short period to avoid duplicate entries
        skipRealtimeReloadRef.current = true;
        setTimeout(() => {
            skipRealtimeReloadRef.current = false;
        }, 2000); // 2 seconds grace period

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
        // Skip realtime reloads for a short period to avoid unnecessary reloads
        skipRealtimeReloadRef.current = true;

        const { error } = await supabase
            .from('projects')
            .update({
                archived: true,
                archived_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            skipRealtimeReloadRef.current = false;
            throw error;
        }

        // Update local state
        setProjects(prev => prev.filter(p => p.id !== id));

        if (currentProject?.id === id) {
            setCurrentProject(null);
            localStorage.removeItem('currentProjectId');
        }

        // Reset skip flag after grace period
        setTimeout(() => {
            skipRealtimeReloadRef.current = false;
        }, 2000);
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

    // Keep a ref to the latest loadProjects function
    const loadProjectsRef = useRef(loadProjects);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipRealtimeReloadRef = useRef(false);

    useEffect(() => {
        loadProjectsRef.current = loadProjects;
    }, [loadProjects]);

    // Debounced reload function to avoid multiple rapid reloads
    const debouncedReload = useCallback(() => {
        // Skip if a local operation just happened
        if (skipRealtimeReloadRef.current) {
            return;
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            loadProjectsRef.current();
        }, 300); // 300ms debounce
    }, []);

    // Subscribe to real-time changes for projects only
    // Note: project_members changes are handled by MemberContext per-project
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
                    debouncedReload();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, debouncedReload]);

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
