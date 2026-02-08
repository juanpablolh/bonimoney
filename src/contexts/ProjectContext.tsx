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
    const [projects, setProjects] = useState<Project[]>(() => {
        const saved = localStorage.getItem('boni_projects');
        return saved ? JSON.parse(saved) : [];
    });
    const [currentProject, setCurrentProject] = useState<Project | null>(() => {
        const savedId = localStorage.getItem('currentProjectId');
        const savedProjects = localStorage.getItem('boni_projects');
        if (savedId && savedProjects) {
            const projects = JSON.parse(savedProjects) as Project[];
            return projects.find(p => p.id === savedId) || null;
        }
        return null;
    });
    const [loading, setLoading] = useState(() => {
        // Only show initial loader if we don't have cached projects
        const saved = localStorage.getItem('boni_projects');
        return !saved || JSON.parse(saved).length === 0;
    });

    // Load user's projects from Supabase
    const loadProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setCurrentProject(null);
            setLoading(false);
            localStorage.removeItem('boni_projects');
            return;
        }

        try {
            // Only set loading true if we have no data (Soft Loading)
            if (projects.length === 0) {
                setLoading(true);
            }

            // Use RPC function to get projects (bypasses RLS issues)
            const { data: projectsData, error } = await supabase.rpc('get_my_projects');

            if (error) {
                // If RPC fails, don't clear state if we have cached data
                return;
            }

            if (!projectsData || projectsData.length === 0) {
                setProjects([]);
                localStorage.setItem('boni_projects', JSON.stringify([]));
                return;
            }

            // Map RPC result to Project type
            const fetchedProjects = projectsData.map((p: any) => ({
                ...p,
                memberCount: p.member_count || 1
            }));

            // Data Stability Check: Only update state and localStorage if data changed
            setProjects(prev => {
                const newProjectIds = new Set(fetchedProjects.map((p: Project) => p.id));
                const existingNotInNew = prev.filter(p => !newProjectIds.has(p.id));
                const finalProjects = [...fetchedProjects, ...existingNotInNew];

                // Simple stringify comparison for deep diff
                if (JSON.stringify(prev) !== JSON.stringify(finalProjects)) {
                    localStorage.setItem('boni_projects', JSON.stringify(finalProjects));
                    return finalProjects;
                }
                return prev;
            });
        } catch {
            // Silent error to keep cached data visible
        } finally {
            setLoading(false);
        }
    }, [user, projects.length]);

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
        setProjects(prev => {
            if (prev.some(p => p.id === newProject.id)) return prev;
            return [newProject, ...prev];
        });
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

        if (error) {
            throw error;
        }

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

    // Throttle last_accessed_at updates (only update every 5 minutes to reduce DB load)
    const lastAccessUpdateRef = useRef<{ projectId: string; timestamp: number } | null>(null);
    const THROTTLE_MINUTES = 5;

    useEffect(() => {
        if (currentProject && user) {
            const now = Date.now();
            const lastUpdate = lastAccessUpdateRef.current;

            // Only update if:
            // 1. Never updated before, OR
            // 2. Different project, OR
            // 3. More than 5 minutes since last update
            const shouldUpdate = !lastUpdate ||
                lastUpdate.projectId !== currentProject.id ||
                (now - lastUpdate.timestamp) > THROTTLE_MINUTES * 60 * 1000;

            if (shouldUpdate) {
                lastAccessUpdateRef.current = {
                    projectId: currentProject.id,
                    timestamp: now
                };

                // Update last_accessed_at in background (throttled)
                supabase
                    .from('user_projects')
                    .update({ last_accessed_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .eq('project_id', currentProject.id)
                    .then(() => { /* Silent update */ });
            }
        }
    }, [currentProject, user]);

    // Real-time subscription
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
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newProject = payload.new as Project;
                        // Only add if not already in state (avoids duplicates from optimistic updates)
                        setProjects(prev => {
                            if (prev.some(p => p.id === newProject.id)) return prev;
                            return [newProject, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedProject = payload.new as Project;
                        setProjects(prev => prev.map(p =>
                            p.id === updatedProject.id ? { ...p, ...updatedProject } : p
                        ));

                        // Also update currentProject if it's the one being edited
                        if (currentProject?.id === updatedProject.id) {
                            setCurrentProject(prev => prev ? { ...prev, ...updatedProject } : null);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedProject = payload.old as { id: string };
                        setProjects(prev => prev.filter(p => p.id !== deletedProject.id));

                        // If current project was deleted, clear selection
                        if (currentProject?.id === deletedProject.id) {
                            setCurrentProject(null);
                            localStorage.removeItem('currentProjectId');
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, currentProject]);

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
