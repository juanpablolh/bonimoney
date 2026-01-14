import React, { useState } from 'react';
import {
  UserPlus,
  PencilSimple,
  Trash,
  ShareNetwork,
  Check,
  X,
  UsersThree,
  Info,
  EnvelopeSimple,
  User,
  PaperPlaneTilt,
  Clock,
  Spinner,
  Crown,
  CheckCircle
} from '@phosphor-icons/react';
import { Member } from '../types';
import { Member as ContextMember } from '../contexts/MemberContext';
import { cn } from '@/lib/utils';
import { capitalizeName } from '../utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from '../utils/avatarColors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendProjectInvitation, resendInvitation } from '@/services/invitations';
import { useAuth } from '@/contexts/AuthContext';

interface MembersSectionProps {
  members: (Member | ContextMember)[];
  onAddMember: (name: string) => void;
  onEditMember: (id: string, newName: string) => void;
  onDeleteMember: (id: string) => Promise<void>;
  onShareGroup: () => void;
  onDeleteProject: () => void;
  onMembersRefresh?: () => void;
}

import { useProject } from '@/contexts/ProjectContext';

export default function MembersSection({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onShareGroup,
  onDeleteProject,
  onMembersRefresh
}: MembersSectionProps) {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | ContextMember | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email invitation state
  const [addMode, setAddMode] = useState<'name' | 'email'>('name');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Helper functions for colors (same as Dashboard)
  const getProjectBgColor = () => {
    const palette = [
      'oklch(0.32 0.08 145)', // 0. Emerald
      'oklch(0.30 0.08 175)', // 1. Deep Teal
      'oklch(0.29 0.09 200)', // 2. Sky
      'oklch(0.27 0.10 225)', // 3. Sapphire
      'oklch(0.27 0.10 250)', // 4. Indigo
      'oklch(0.27 0.10 265)', // 5. Deep Violet
      'oklch(0.29 0.11 290)', // 6. Purple
      'oklch(0.32 0.12 310)', // 7. Orchid
      'oklch(0.29 0.12 330)', // 8. Magenta
      'oklch(0.29 0.10 350)', // 9. Rose
      'oklch(0.32 0.12 15)',  // 10. Crimson
      'oklch(0.34 0.10 35)',  // 11. Red Orange
      'oklch(0.34 0.09 55)',  // 12. Burnt Orange
      'oklch(0.34 0.08 80)',  // 13. Amber
      'oklch(0.32 0.07 110)', // 14. Olive
    ];

    if (currentProject?.color) {
      switch (currentProject.color) {
        case 'project-emerald': return palette[0];
        case 'project-teal': return palette[1];
        case 'project-sky': return palette[2];
        case 'project-sapphire': return palette[3];
        case 'project-indigo': return palette[4];
        case 'project-violet': return palette[5];
        case 'project-purple': return palette[6];
        case 'project-orchid': return palette[7];
        case 'project-magenta': return palette[8];
        case 'project-rose': return palette[9];
        case 'project-crimson': return palette[10];
        case 'project-orange': return palette[11];
        case 'project-burntorange': return palette[12];
        case 'project-amber': return palette[13];
        case 'project-olive': return palette[14];
      }
    }

    if (currentProject?.id) {
      const id = currentProject.id;
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    }
    return palette[0];
  };

  const getProjectButtonBgColor = () => {
    const palette = [
      'oklch(0.22 0.06 145)', // 0. Emerald
      'oklch(0.20 0.06 175)', // 1. Deep Teal
      'oklch(0.19 0.07 200)', // 2. Sky
      'oklch(0.17 0.08 225)', // 3. Sapphire
      'oklch(0.17 0.08 250)', // 4. Indigo
      'oklch(0.17 0.08 265)', // 5. Deep Violet
      'oklch(0.19 0.09 290)', // 6. Purple
      'oklch(0.22 0.10 310)', // 7. Orchid
      'oklch(0.19 0.10 330)', // 8. Magenta
      'oklch(0.19 0.08 350)', // 9. Rose
      'oklch(0.22 0.10 15)',  // 10. Crimson
      'oklch(0.24 0.08 35)',  // 11. Red Orange
      'oklch(0.24 0.07 55)',  // 12. Burnt Orange
      'oklch(0.24 0.06 80)',  // 13. Amber
      'oklch(0.22 0.05 110)', // 14. Olive
    ];

    if (currentProject?.color) {
      switch (currentProject.color) {
        case 'project-emerald': return palette[0];
        case 'project-teal': return palette[1];
        case 'project-sky': return palette[2];
        case 'project-sapphire': return palette[3];
        case 'project-indigo': return palette[4];
        case 'project-violet': return palette[5];
        case 'project-purple': return palette[6];
        case 'project-orchid': return palette[7];
        case 'project-magenta': return palette[8];
        case 'project-rose': return palette[9];
        case 'project-crimson': return palette[10];
        case 'project-orange': return palette[11];
        case 'project-burntorange': return palette[12];
        case 'project-amber': return palette[13];
        case 'project-olive': return palette[14];
      }
    }

    if (currentProject?.id) {
      const id = currentProject.id;
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    }
    return palette[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
    }
  };

  const handleStartEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setEditingName(member.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onEditMember(id, editingName.trim());
      setEditingMemberId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditingName('');
  };

  // Handle email invitation
  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentProject || !user) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Un usuario';

    const result = await sendProjectInvitation(
      currentProject.id,
      inviteEmail,
      inviterName,
      currentProject.name,
      currentProject.icon
    );

    if (result.success) {
      setInviteSuccess(true);
      setInviteEmail('');
      onMembersRefresh?.();
      // Reset success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000);
    } else {
      setInviteError(result.error || 'Error al enviar invitacion');
    }

    setInviting(false);
  };

  // Handle resend invitation
  const handleResendInvitation = async (member: ContextMember) => {
    if (!currentProject || !user || !member.email) return;

    setResendingId(member.id);

    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Un usuario';

    const result = await resendInvitation(
      member.id,
      inviterName,
      currentProject.name,
      currentProject.icon
    );

    if (!result.success) {
      setInviteError(result.error || 'Error al reenviar invitacion');
    }

    setResendingId(null);
  };

  // Helper to check if member has context fields (email, status)
  const isContextMember = (m: Member | ContextMember): m is ContextMember => {
    return 'status' in m;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. ADD MEMBER HERO CARD (Styled like Dashboard Project Card) */}
      <section
        className="rounded-xl p-4 text-white transition-all shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px]"
        style={{ backgroundColor: getProjectBgColor() }}
      >
        <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-[22px] font-serif tracking-tight leading-none text-white flex items-center gap-3">
              <span className="text-4xl">{currentProject?.icon || <UsersThree size={32} weight="fill" />}</span>
              Agranda el Círculo
            </h3>
            <p className="text-white/80 text-sm font-medium max-w-sm">
              Suma a todas las personas que compartirán gastos en este grupo para empezar a organizar.
            </p>
          </div>

          {/* Mode Toggle */}
          {user && (
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setAddMode('name'); setInviteError(null); }}
                className={cn(
                  "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                  addMode === 'name'
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/60 hover:text-white/80"
                )}
              >
                <User size={16} weight="bold" />
                Por nombre
              </button>
              <button
                type="button"
                onClick={() => { setAddMode('email'); setInviteError(null); }}
                className={cn(
                  "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                  addMode === 'email'
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/60 hover:text-white/80"
                )}
              >
                <EnvelopeSimple size={16} weight="bold" />
                Por email
              </button>
            </div>
          )}

          {/* Add by Name Form */}
          {addMode === 'name' && (
            <form onSubmit={handleSubmit} className="relative mt-2">
              <div className="relative w-full">
                <Input
                  placeholder="Nuevo integrante"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="w-full h-14 bg-black/20 border-none text-white placeholder:text-white/60 rounded-xl pl-4 pr-36 focus-visible:ring-0 text-base font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50"
                  style={{
                    backgroundColor: getProjectButtonBgColor(),
                    borderRadius: '0.75rem'
                  }}
                >
                  <UserPlus size={16} weight="bold" className="text-white" />
                  <span className="text-sm font-semibold text-white">Agregar</span>
                </button>
              </div>
            </form>
          )}

          {/* Invite by Email Form */}
          {addMode === 'email' && (
            <form onSubmit={handleInviteByEmail} className="relative mt-2 space-y-3">
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                  required
                  disabled={inviting}
                  className="w-full h-14 bg-black/20 border-none text-white placeholder:text-white/60 rounded-xl pl-4 pr-36 focus-visible:ring-0 text-base font-medium"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50"
                  style={{
                    backgroundColor: getProjectButtonBgColor(),
                    borderRadius: '0.75rem'
                  }}
                >
                  {inviting ? (
                    <Spinner size={16} className="text-white animate-spin" />
                  ) : (
                    <PaperPlaneTilt size={16} weight="bold" className="text-white" />
                  )}
                  <span className="text-sm font-semibold text-white">
                    {inviting ? 'Enviando...' : 'Invitar'}
                  </span>
                </button>
              </div>

              {/* Success message */}
              {inviteSuccess && (
                <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium animate-in fade-in">
                  <CheckCircle size={16} weight="fill" />
                  <span>Invitacion enviada correctamente</span>
                </div>
              )}

              {/* Error message */}
              {inviteError && (
                <div className="flex items-center gap-2 text-orange-200 text-sm font-medium animate-in fade-in">
                  <Info size={16} weight="fill" />
                  <span>{inviteError}</span>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* 2. MEMBERS LIST / GRID */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h4 className="text-base font-normal tracking-[0.1px] text-neutral-400">Integrantes ({members.length})</h4>
        </div>

        <div className="grid gap-4 overflow-hidden">
          {members.length === 0 ? (
            <div className="py-20 bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <UsersThree size={32} className="text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-sm italic">Todavía no hay nadie aquí...</p>
            </div>
          ) : (
            members.map((member) => {
              const isEditing = editingMemberId === member.id;

              // Check if member is ContextMember to access user_id
              const isContext = isContextMember(member);
              const isMe = isContext && member.user_id === user?.id;

              // Find current user's role
              // We calculate this for every item to keep it simple within the map scope, 
              // though it could be optimized by moving outside the map.
              const myMemberRecord = members.find(m => isContextMember(m) && m.user_id === user?.id) as ContextMember | undefined;
              const isOwner = myMemberRecord?.role === 'owner';

              return (
                <div
                  key={member.id}
                  className={cn(
                    "bg-white rounded-xl p-4 border transition-all flex flex-col gap-3 group shadow-sm overflow-hidden",
                    isEditing ? "border-neutral-900 ring-4 ring-neutral-900/5 shadow-xl" : "border-neutral-100 hover:border-neutral-300 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                      {(() => {
                        const colors = getMemberAvatarColor(member);
                        return (
                          <Avatar className="w-10 h-10 shadow-sm ring-1 ring-neutral-100">
                            <AvatarImage src={'avatar_url' in member ? member.avatar_url : undefined} />
                            <AvatarFallback
                              className="font-semibold text-lg"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {(member.name || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })()}

                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(member.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-10 border-none bg-neutral-50 rounded-xl font-bold text-lg focus-visible:ring-0"
                        />
                      ) : (
                        <div className="space-y-0 min-w-0 flex-1">
                          <div className="flex flex-col gap-1 flex-nowrap justify-center items-start">
                            <p className="text-base font-medium text-neutral-900 tracking-tight leading-none">
                              {member.name.charAt(0).toUpperCase() + member.name.slice(1)}
                            </p>
                            {/* Status badges */}
                            {isContextMember(member) && (
                              <>
                                {member.status === 'pending' && member.email && (
                                  <span className="inline-flex items-center gap-1 text-[12px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium shrink-0">
                                    <Clock size={12} weight="bold" />
                                    Pendiente
                                  </span>
                                )}
                                {member.status === 'accepted' && (
                                  <span className={`inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full font-medium shrink-0 ${member.role === 'owner'
                                    ? 'bg-purple-50 text-purple-700'
                                    : member.user_id
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {member.role === 'owner' ? (
                                      <>
                                        <Crown size={12} weight="fill" />
                                        Admin
                                      </>
                                    ) : member.user_id ? (
                                      <>
                                        <User size={12} weight="fill" />
                                        Miembro
                                      </>
                                    ) : (
                                      <>
                                        <User size={12} weight="regular" />
                                        Invitado
                                      </>
                                    )}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(member.id)}
                            className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                          >
                            <Check size={20} weight="bold" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                          >
                            <X size={20} weight="bold" />
                          </button>
                        </>
                      ) : (
                        <>
                          {(isOwner || isMe) && (
                            <button
                              onClick={() => handleStartEdit(member)}
                              className="w-10 h-10 rounded-full bg-transparent text-neutral-400 md:text-neutral-300 flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              title={isMe ? "Cambiar mi nombre" : "Editar integrante"}
                            >
                              <PencilSimple size={18} weight="bold" />
                            </button>
                          )}
                          {isOwner && !isMe && (
                            <button
                              onClick={() => {
                                setMemberToDelete(member);
                                setDeleteMemberDialogOpen(true);
                              }}
                              className="w-10 h-10 rounded-full bg-transparent text-neutral-400 md:text-neutral-300 flex items-center justify-center hover:text-orange-600 hover:bg-orange-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 min-w-10"
                              title="Eliminar integrante"
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Resend invitation button for pending members (Full Width at Bottom) */}
                  {isContextMember(member) && member.status === 'pending' && member.email && !isEditing && (
                    <button
                      onClick={() => handleResendInvitation(member)}
                      disabled={resendingId === member.id}
                      className="w-full h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center gap-2 hover:bg-amber-100 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                      {resendingId === member.id ? (
                        <Spinner size={16} className="animate-spin" />
                      ) : (
                        <PaperPlaneTilt size={16} weight="bold" />
                      )}
                      Reenviar invitación
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. SHARE LINK CARD (Premium Polish) */}
      {members.length > 0 && (
        <section className="bg-neutral-50 rounded-3xl p-4 border border-neutral-100 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-200 rounded-2xl flex items-center justify-center text-neutral-400 shrink-0">
              <Info size={24} weight="bold" className="text-green-700" />
            </div>
            <div className="space-y-1">
              <h5 className="font-normal text-neutral-900 text-lg">¿Sabías que puedes sincronizar?</h5>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Inicia sesión para compartir este grupo con otros integrantes y ver los cambios en tiempo real.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onShareGroup}
            className="w-full h-14 rounded-2xl bg-white border-neutral-200 text-neutral-900 font-semibold flex gap-2 active:scale-[0.98] transition-all"
          >
            <ShareNetwork size={20} weight="bold" />
            Compartir Proyecto
          </Button>
        </section>
      )}

      {/* 4. DELETE PROJECT SECTION */}
      <section className="flex justify-end pt-4 pb-2">
        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors px-4 py-2"
        >
          <span className="font-medium text-sm">Cerrar grupo</span>
          <Trash size={16} />
        </button>
      </section>

      {/* DELETE PROJECT DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-[28px] font-serif font-bold text-neutral-900 text-left leading-tight">Cerrar grupo</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed">
              ¿Estás seguro que quieres cerrar este grupo? Esta acción no se puede deshacer y borrará todos los gastos y datos asociados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={() => {
                onDeleteProject();
                setDeleteDialogOpen(false);
              }}
            >
              Cerrar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MEMBER DIALOG */}
      <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-[28px] font-serif font-bold text-neutral-900 text-left leading-tight">Eliminar integrante</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed">
              ¿Estás seguro que quieres eliminar a <span className="text-neutral-900 font-bold">{capitalizeName(memberToDelete?.name)}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={() => setDeleteMemberDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={async () => {
                if (memberToDelete) {
                  try {
                    await onDeleteMember(memberToDelete.id);
                    setDeleteMemberDialogOpen(false);
                  } catch {
                    setDeleteMemberDialogOpen(false);
                    setErrorMessage('No se puede eliminar este integrante porque tiene gastos o transacciones asociadas. Elimina sus gastos primero.');
                    setErrorDialogOpen(true);
                  }
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ERROR DIALOG */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-[28px] font-serif font-bold text-neutral-900 text-left leading-tight">No se puede eliminar</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="default"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={() => setErrorDialogOpen(false)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
