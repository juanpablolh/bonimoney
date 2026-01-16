import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { supabase } from '../utils/supabase';

export interface Member {
    id: string;
    project_id: string;
    user_id?: string;
    email?: string;
    name: string;
    avatar_url?: string;
    role: 'owner' | 'member';
    status: 'pending' | 'accepted';
    invited_by?: string;
    invited_at?: string;
    joined_at?: string;
    created_at: string;
    updated_at: string;
}

interface MemberContextType {
    members: Member[];
    loading: boolean;
    loadMembers: () => Promise<void>;
    addMember: (data: AddMemberData) => Promise<Member>;
    updateMember: (id: string, data: Partial<Member>) => Promise<void>;
    removeMember: (id: string) => Promise<void>;
}

interface AddMemberData {
    name: string;
    email?: string;
    role?: 'owner' | 'member';
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentProject } = useProject();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);

    // Load members for current project
    const loadMembers = useCallback(async () => {
        if (!currentProject) {
            setMembers([]);
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('project_members')
                .select('*')
                .eq('project_id', currentProject.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMembers(data || []);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, [currentProject]);

    // Add member (ghost or invited)
    const addMember = async (data: AddMemberData): Promise<Member> => {
        if (!currentProject || !user) throw new Error('No project selected or user not authenticated');

        const { data: newMember, error } = await supabase
            .from('project_members')
            .insert({
                project_id: currentProject.id,
                name: data.name,
                email: data.email,
                role: data.role || 'member',
                status: data.email ? 'pending' : 'accepted', // Ghost members are auto-accepted
                invited_by: user.id,
                joined_at: data.email ? null : new Date().toISOString(), // Ghost members join immediately
            })
            .select()
            .single();

        if (error) throw error;

        setMembers(prev => [...prev, newMember]);
        return newMember;
    };

    // Update member
    const updateMember = async (id: string, data: Partial<Member>) => {
        const { error } = await supabase
            .from('project_members')
            .update(data)
            .eq('id', id);

        if (error) throw error;

        setMembers(prev =>
            prev.map(m => (m.id === id ? { ...m, ...data } : m))
        );
    };

    // Remove member
    const removeMember = async (id: string) => {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setMembers(prev => prev.filter(m => m.id !== id));
    };

    // Load members when project changes
    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Keep a ref to the latest loadMembers function
    const loadMembersRef = useRef(loadMembers);
    useEffect(() => {
        loadMembersRef.current = loadMembers;
    }, [loadMembers]);

    // Subscribe to real-time changes for project members
    useEffect(() => {
        if (!currentProject) return;

        const channel = supabase
            .channel(`members:${currentProject.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_members',
                    filter: `project_id=eq.${currentProject.id}`
                },
                () => {
                    loadMembersRef.current();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentProject]);

    return (
        <MemberContext.Provider
            value={{
                members,
                loading,
                loadMembers,
                addMember,
                updateMember,
                removeMember,
            }}
        >
            {children}
        </MemberContext.Provider>
    );
}

export function useMembers() {
    const context = useContext(MemberContext);
    if (context === undefined) {
        throw new Error('useMembers must be used within a MemberProvider');
    }
    return context;
}
