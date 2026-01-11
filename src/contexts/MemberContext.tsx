import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { supabase } from '../utils/supabase';

export interface Member {
    id: string;
    project_id: string;
    user_id?: string;
    email?: string;
    name: string;
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
    const loadMembers = async () => {
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
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add member (ghost or invited)
    const addMember = async (data: AddMemberData): Promise<Member> => {
        if (!currentProject || !user) throw new Error('No project selected or user not authenticated');

        try {
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
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    };

    // Update member
    const updateMember = async (id: string, data: Partial<Member>) => {
        try {
            const { error } = await supabase
                .from('project_members')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            setMembers(prev =>
                prev.map(m => (m.id === id ? { ...m, ...data } : m))
            );
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        }
    };

    // Remove member
    const removeMember = async (id: string) => {
        try {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        }
    };

    // Load members when project changes
    useEffect(() => {
        loadMembers();
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
