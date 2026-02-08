import React, { useState } from 'react';
import {
  UserPlus,
  PencilSimple,
  Trash,
  Check,
  X,
  UsersThree,
  EnvelopeSimple,
  User,
  PaperPlaneTilt,
  Clock,
  Spinner,
  Crown,
  CheckCircle
} from '@phosphor-icons/react';
import { MemberDeletionSheet } from '../components/sheets/MemberDeletionSheet';
import { useMembers } from '@/contexts/MemberContext';
import { useExpenses } from '@/contexts/ExpenseContext';
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

import { useProject } from '@/contexts/ProjectContext';
import { getProjectTheme } from '@/utils/projectTheme';
import { useMemo } from 'react';
import { adaptMembers, adaptExpenses } from '../utils/dataAdapters';
import { calculateBalancesByCurrency } from '../utils/calculations';


/**
 * ProjectMembers Component
 * 
 * Manages all member-related operations for a project:
 * - Add members by name (local) or invite by email (authenticated users)
 * - Edit member names (owners can edit any, members can edit their own)
 * - Delete members (with activity resolution flow for members with expenses)
 * - Resend email invitations to pending members
 * - Display member status (pending, accepted) and roles (owner, member, guest)
 * 
 * Key Flows:
 * 1. Add Member: Simple name input for quick local member creation
 * 2. Invite by Email: Send invitation email (requires authentication)
 * 3. Delete Member: 
 *    - No activity: Simple confirmation dialog
 *    - Has activity: Resolution dialog (reassign or purge expenses)
 */
export default function ProjectMembers() {
  const { currentProject } = useProject();
  const { members: contextMembers, addMember, updateMember, removeMember, loadMembers, resolveMemberDeletion } = useMembers();
  const { expenses: contextExpenses, loadExpenses } = useExpenses();
  const { user } = useAuth();

  // Adapt data from contexts
  const members = useMemo(() => contextMembers, [contextMembers]);
  const expenses = useMemo(() => adaptExpenses(contextExpenses), [contextExpenses]);
  const adaptedMembers = useMemo(() => adaptMembers(contextMembers), [contextMembers]);

  // Calculate balances
  const balancesByCurrency = useMemo(() =>
    calculateBalancesByCurrency(adaptedMembers, expenses),
    [adaptedMembers, expenses]
  );

  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | ContextMember | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resolution Dialog state
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [memberActivity, setMemberActivity] = useState<{ totalPaid: number, totalOwed: number, currency: string } | undefined>(undefined);

  // Email invitation state
  const [addMode, setAddMode] = useState<'name' | 'email'>('name');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const theme = getProjectTheme(currentProject?.color, currentProject?.id);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      await addMember({ name: newMemberName.trim() });
      setNewMemberName('');
    }
  };

  // Handle delete member - check activity first and route to appropriate dialog
  const handleDeleteMemberClick = (member: Member | ContextMember) => {
    setMemberToDelete(member);

    // Check if member has activity
    let hasActivity = false;
    let activityData = { totalPaid: 0, totalOwed: 0, currency: 'CLP' };

    if (balancesByCurrency) {
      for (const [currency, balances] of balancesByCurrency.entries()) {
        const balance = balances.find(b => b.memberId === member.id);
        if (balance && (Math.abs(balance.totalPaid) > 0.01 || Math.abs(balance.totalOwed) > 0.01)) {
          hasActivity = true;
          activityData = {
            totalPaid: balance.totalPaid,
            totalOwed: balance.totalOwed,
            currency: currency as string
          };
          break;
        }
      }
    }

    if (hasActivity) {
      // Show resolution dialog immediately
      setMemberActivity(activityData);
      setResolutionDialogOpen(true);
    } else {
      // Show simple confirmation dialog
      setDeleteMemberDialogOpen(true);
    }
  };

  // Handle edit member
  const handleEditMember = (member: Member | ContextMember) => {
    setEditingMemberId(member.id);
    setEditingName(member.name);
  };

  // Handle save edit
  const handleSaveEdit = async (id: string) => {
    if (editingName.trim()) {
      await updateMember(id, { name: editingName.trim() });
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
      loadMembers();
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* ========================================
            SECTION 1: ADD MEMBER CARD
            
            Hero-style card for adding new members to the project.
            Features:
            - Two modes: Add by name (local) or Invite by email (requires auth)
            - Themed styling based on project color
            - Real-time validation and feedback
            - Success/error messages for email invitations
        ======================================== */}
        <div className="lg:sticky lg:top-4">
          <section
            className="rounded-xl p-4 transition-all shadow-md overflow-hidden flex flex-col justify-between min-h-[220px] relative group"
            style={{ backgroundColor: theme.bgColor, borderColor: theme.borderColor }}
          >
            {/* Overlay */}
            <div className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-300",
              theme.overlay || "bg-gradient-to-br from-white/5 to-transparent opacity-30"
            )} />

            <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-serif tracking-tight leading-none flex items-center gap-3" style={{ color: theme.textColor }}>
                  <span className="text-2xl filter drop-shadow-sm">{currentProject?.icon || <UsersThree size={32} weight="fill" />}</span>
                  Agrega integrantes
                </h3>
                <p className="text-sm font-medium leading-normal max-w-sm" style={{ color: theme.mutedTextColor }}>
                  Suma a todas las personas que compartirán gastos en este grupo para empezar a organizar.
                </p>
              </div>

              {/* Mode Toggle: Switch between adding by name (local) or inviting by email (authenticated) */}
              {user && (
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setAddMode('name'); setInviteError(null); }}
                    style={{
                      backgroundColor: addMode === 'name' ? theme.iconBgColor : 'transparent',
                      color: addMode === 'name' ? theme.textColor : theme.mutedTextColor
                    }}
                    className={cn(
                      "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/20"
                    )}
                  >
                    <User size={16} weight="bold" />
                    Por nombre
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddMode('email'); setInviteError(null); }}
                    style={{
                      backgroundColor: addMode === 'email' ? theme.iconBgColor : 'transparent',
                      color: addMode === 'email' ? theme.textColor : theme.mutedTextColor
                    }}
                    className={cn(
                      "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/20"
                    )}
                  >
                    <EnvelopeSimple size={16} weight="bold" />
                    Por email
                  </button>
                </div>
              )}

              {/* Add by Name Form: Quick local member creation without authentication */}
              {addMode === 'name' && (
                <form onSubmit={handleSubmit} className="relative mt-2">
                  <div className="relative w-full">
                    <Input
                      placeholder="Nuevo integrante"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      required
                      className="w-full h-14 bg-white/60 border-none text-neutral-900 placeholder:text-neutral-500 rounded-xl pl-4 pr-16 focus-visible:ring-0 text-base font-medium backdrop-blur-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMemberName.trim()}
                      style={{
                        backgroundColor: theme.textColor,
                        borderRadius: '0.75rem',
                        width: '48px',
                        height: '48px'
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50 text-white"
                      title="Agregar integrante"
                    >
                      <UserPlus size={20} weight="bold" />
                    </button>
                  </div>
                </form>
              )}

              {/* Invite by Email Form: Send email invitation to join project (requires authentication) */}
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
                      className="w-full h-14 bg-white/60 border-none text-neutral-900 placeholder:text-neutral-500 rounded-xl pl-4 pr-16 focus-visible:ring-0 text-base font-medium backdrop-blur-sm"
                    />
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      style={{
                        backgroundColor: theme.textColor,
                        borderRadius: '0.75rem',
                        width: '48px',
                        height: '48px'
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50 text-white"
                      title={inviting ? 'Enviando...' : 'Invitar por email'}
                    >
                      {inviting ? (
                        <Spinner size={20} className="text-white animate-spin" />
                      ) : (
                        <PaperPlaneTilt size={20} weight="bold" />
                      )}
                    </button>
                  </div>

                  {/* Success message */}
                  {inviteSuccess && (
                    <div className="flex items-center gap-2 text-sm font-medium animate-in fade-in" style={{ color: theme.textColor }}>
                      <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                      <span>Invitacion enviada correctamente</span>
                    </div>
                  )}

                  {/* Error message */}
                  {inviteError && (
                    <div className="flex items-center gap-2 text-sm font-medium animate-in fade-in text-rose-600">
                      <X size={16} weight="fill" />
                      <span>{inviteError}</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* ========================================
              SECTION 2: MEMBERS LIST
              
              Displays all project members with:
              - Avatar with color coding
              - Name (editable inline)
              - Status badges (Pending, Admin, Member, Guest)
              - Action buttons (Edit, Delete) based on permissions
              - Resend invitation button for pending members
              
              Permissions:
              - Owners: Can edit/delete any member (except themselves)
              - Members: Can only edit their own name
          ======================================== */}
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
                                  onClick={() => handleEditMember(member)}
                                  className="w-10 h-10 rounded-full bg-transparent text-neutral-400 md:text-neutral-300 flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title={isMe ? "Cambiar mi nombre" : "Editar integrante"}
                                >
                                  <PencilSimple size={18} weight="bold" />
                                </button>
                              )}
                              {isOwner && !isMe && (
                                <button
                                  onClick={() => handleDeleteMemberClick(member)}
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

                      {/* Resend Invitation: For pending members who haven't accepted yet */}
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


          {/* ========================================
              DIALOG: DELETE MEMBER (No Activity)
              
              Simple confirmation dialog shown when deleting a member
              who has NO expenses or transactions associated.
              For members with activity, see Resolution Dialog below.
          ======================================== */}
          <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
            <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-3xl p-6 gap-0" showCloseButton={false}>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0 mb-4">
                <DialogTitle className="text-2xl font-serif font-medium tracking-tight text-neutral-900 text-left leading-tight">Eliminar integrante</DialogTitle>
                <button
                  onClick={() => setDeleteMemberDialogOpen(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500"
                >
                  <X size={20} weight="bold" />
                </button>
              </DialogHeader>
              <DialogHeader className="space-y-4">
                <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed -mt-4 py-4">
                  ¿Quieres eliminar a <span className="text-neutral-900 font-bold">{capitalizeName(memberToDelete?.name)}</span> de este grupo?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl w-full sm:w-auto min-w-[120px]"
                  onClick={() => setDeleteMemberDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-2xl w-full sm:w-auto min-w-[120px]"
                  onClick={async () => {
                    if (memberToDelete) {
                      try {
                        await removeMember(memberToDelete.id);
                        setDeleteMemberDialogOpen(false);
                      } catch {
                        setDeleteMemberDialogOpen(false);
                        setErrorMessage('No se puede eliminar este integrante. Es posible que tenga gastos o transacciones asociadas que no pudimos procesar.');
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

          {/* ========================================
              DIALOG: ERROR
              
              Generic error dialog shown when member deletion fails
              due to database constraints or other unexpected issues.
          ======================================== */}
          <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
            <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0" showCloseButton={false}>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0 mb-4">
                <DialogTitle className="text-2xl font-serif font-medium tracking-tight text-neutral-900 text-left leading-tight">No se puede eliminar</DialogTitle>
                <button
                  onClick={() => setErrorDialogOpen(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500"
                >
                  <X size={20} weight="bold" />
                </button>
              </DialogHeader>
              <DialogHeader className="space-y-4">
                <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed -mt-4">
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
          {/* END RIGHT COLUMN WRAPPER */}
        </div>
      </div>

      {/* ========================================
          DIALOG: DELETION RESOLUTION (Has Activity)
          
          Advanced dialog shown when deleting a member who has
          expenses or transactions associated with them.
          
          Options:
          1. Reassign: Transfer all expenses to another member
          2. Purge: Delete all associated expenses (destructive)
          
          This ensures data integrity and gives users control
          over how to handle the member's financial activity.
      ======================================== */}
      {memberToDelete && (
        <MemberDeletionSheet
          open={resolutionDialogOpen}
          onOpenChange={setResolutionDialogOpen}
          member={memberToDelete as Member}
          otherMembers={members.filter(m => m.id !== memberToDelete.id) as Member[]}
          activitySummary={memberActivity}
          onResolve={async (type: 'reassign' | 'purge', targetMemberId?: string) => {
            await resolveMemberDeletion(memberToDelete.id, type, targetMemberId);
            // Refresh both context states to ensure recalculation
            loadMembers();
            await loadExpenses();
          }}
        />
      )}
    </div>
  );
}
