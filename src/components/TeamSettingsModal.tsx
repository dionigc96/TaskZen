'use client'

import { useState, useEffect } from 'react'
import { Team, TeamMember, TeamRole } from '@/types'
import { fetchTeamMembers, inviteMemberByEmail, removeTeamMember, updateMemberRole } from '@/utils/supabase/teams'
import { UserPlus, Trash2, Shield, ShieldCheck, User, X } from 'lucide-react'

export function TeamSettingsModal({ 
  isOpen, 
  team, 
  onClose,
  currentUserRole
}: { 
  isOpen: boolean, 
  team: Team | null, 
  onClose: () => void,
  currentUserRole: TeamRole
}) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const canManage = currentUserRole === 'admin'

  useEffect(() => {
    if (isOpen && team) {
      loadMembers()
    }
  }, [isOpen, team])

  const loadMembers = async () => {
    if (!team) return
    setIsLoading(true)
    const data = await fetchTeamMembers(team.id)
    setMembers(data)
    setIsLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !inviteEmail.trim()) return

    setIsInviting(true)
    setInviteError(null)

    const result = await inviteMemberByEmail(team.id, inviteEmail.trim(), inviteRole)
    
    if (result.success) {
      setInviteEmail('')
      loadMembers()
    } else {
      setInviteError(result.error || 'Error al invitar al usuario.')
    }
    setIsInviting(false)
  }

  const handleRemove = async (userId: string) => {
    if (!team || !window.confirm('¿Eliminar a este miembro del equipo?')) return
    const success = await removeTeamMember(team.id, userId)
    if (success) loadMembers()
  }

  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    if (!team) return
    const success = await updateMemberRole(team.id, userId, newRole)
    if (success) loadMembers()
  }

  if (!isOpen || !team) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4 animate-in fade-in zoom-in duration-300">
        <div className="overflow-hidden rounded-3xl border border-surface-container-high bg-surface-container-low shadow-2xl flex flex-col max-h-[85vh]">
          
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Ajustes de Equipo: {team.name}</h2>
              <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest font-extrabold flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-primary" /> Gestión de Miembros y Roles
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            
            {/* Invitación */}
            {canManage && (
              <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-inner">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" /> Invitar nuevo miembro
                </h3>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email del usuario..."
                    className="flex-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required
                  />
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                    className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 px-4 py-3 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="member">Miembro</option>
                    <option value="product_owner">Product Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-6 rounded-xl bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary-dim transition-all disabled:opacity-50 min-h-[48px]"
                  >
                    {isInviting ? 'Invitando...' : 'Invitar'}
                  </button>
                </form>
                {inviteError && (
                  <p className="text-xs text-error font-bold mt-3 ml-1">{inviteError}</p>
                )}
              </section>
            )}

            {/* Listado de Miembros */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Miembros del Equipo ({members.length})</h3>
              
              <div className="flex flex-col gap-2">
                {isLoading ? (
                  <div className="p-8 text-center text-on-surface-variant animate-pulse">Cargando miembros...</div>
                ) : members.map((m) => (
                  <div key={m.id} className="group flex items-center gap-4 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 bg-surface-container-high shrink-0">
                      <img 
                        src={m.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface truncate">{m.profile?.full_name || 'Sin nombre'}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{m.profile?.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {canManage && m.role !== 'admin' ? (
                        <select 
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user_id, e.target.value as TeamRole)}
                          className="bg-surface-container rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 outline-none cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          <option value="member">Miembro</option>
                          <option value="product_owner">Product Owner</option>
                        </select>
                      ) : (
                        <div className="flex flex-col items-end">
                           <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter flex items-center gap-1 ${
                            m.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/20' : 
                            m.role === 'product_owner' ? 'bg-secondary/20 text-secondary border border-secondary/20' : 
                            'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                            {m.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                            {m.role === 'product_owner' && <ShieldCheck className="w-2.5 h-2.5" />}
                            {m.role === 'member' && <User className="w-2.5 h-2.5" />}
                            {m.role}
                          </span>
                        </div>
                      )}

                      {canManage && m.role !== 'admin' && (
                        <button 
                          onClick={() => handleRemove(m.user_id)}
                          className="p-2 rounded-lg text-on-surface-variant/40 hover:bg-error/10 hover:text-error transition-all"
                          title="Eliminar miembro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  )
}
