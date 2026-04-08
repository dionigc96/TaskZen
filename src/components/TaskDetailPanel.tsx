'use client'

import { useState, useEffect } from 'react'
import { Task, Tag, TeamMember, TeamRole, TaskComment } from '@/types'
import { TagSelector } from './TagSelector'
import { TagBadge } from './TagBadge'
import { Plus, User, ShieldAlert, MessageSquare, Send, Reply, Trash2, Calendar } from 'lucide-react'
import { fetchTaskComments, createComment, deleteComment } from '@/utils/supabase/comments'

export function TaskDetailPanel({ 
   isOpen, 
   task, 
   autoEditTags = false,
   onClose, 
   onUpdate, 
   onDelete,
   teamMembers = [],
   currentUserRole = 'member',
   currentUserId = '',
   teamId = null
}: { 
   isOpen: boolean, 
   task: Task | null, 
   autoEditTags?: boolean,
   onClose: () => void, 
   onUpdate: (id: string, partial: Partial<Task>) => Promise<void>, 
   onDelete: (id: string) => Promise<void>,
   teamMembers?: TeamMember[],
   currentUserRole?: TeamRole,
   currentUserId?: string,
   teamId?: string | null
}) {
   const [isEditing, setIsEditing] = useState(false);
   const [editedTitle, setEditedTitle] = useState('');
   const [editedDesc, setEditedDesc] = useState('');
   const [editedTagIds, setEditedTagIds] = useState<string[]>([]);
   const [editedAssignedTo, setEditedAssignedTo] = useState<string>('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   // Estados para comentarios
   const [comments, setComments] = useState<TaskComment[]>([]);
   const [newComment, setNewComment] = useState('');
   const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null);
   const [isLoadingComments, setIsLoadingComments] = useState(false);

   // RBAC: Roles higher than member OR creator can edit/delete
   const canManage = currentUserRole === 'admin' || currentUserRole === 'product_owner' || task?.user_id === currentUserId;

   useEffect(() => {
      if (task) {
         setEditedTitle(task.title);
         setEditedDesc(task.description || '');
         setEditedTagIds(task.tags?.map(t => t.id) || []);
         setEditedAssignedTo(task.assigned_to || '');
         
         // Si venimos de un "Quick Add", activamos edición de inmediato
         if (autoEditTags) {
            setIsEditing(true);
         } else {
            setIsEditing(false);
         }

         loadComments();
      }
   }, [task, autoEditTags]);

   const loadComments = async () => {
      if (!task) return;
      setIsLoadingComments(true);
      const data = await fetchTaskComments(task.id);
      setComments(data);
      setIsLoadingComments(false);
   }

   if (!task) return null;

   const handleSave = async () => {
      setIsSubmitting(true);
      await onUpdate(task.id, { 
        title: editedTitle.trim() || 'Sin Título', 
        description: editedDesc,
        // @ts-ignore
        tag_ids: editedTagIds,
        assigned_to: editedAssignedTo || null
      });
      setIsSubmitting(false);
      setIsEditing(false);
   }

   const handleDelete = async () => {
      if (window.confirm("¿Estás súper seguro de que quieres eliminar esta tarea permanentemente? (Esta acción no se puede deshacer)")) {
         setIsSubmitting(true);
         await onDelete(task.id);
         setIsSubmitting(false);
      }
   }

   const handleAddComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim() || !task) return;

      const comment = await createComment(
         task.id, 
         currentUserId, 
         newComment, 
         replyingTo?.id || null
      );

      if (comment) {
         setNewComment('');
         setReplyingTo(null);
         loadComments(); // Recargar para ver el nuevo comentario/respuesta
      }
   }

   const handleDeleteComment = async (id: string) => {
      if (window.confirm("¿Eliminar comentario?")) {
         const success = await deleteComment(id);
         if (success) loadComments();
      }
   }

   return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-background/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         
         <div className={`w-full max-w-2xl max-h-[90vh] bg-surface-container-low rounded-3xl border border-surface-container-high shadow-[0_20px_60px_rgba(0,0,0,0.6)] transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col overflow-hidden ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
         
         {/* Botonera superior flotante */}
         <div className="absolute top-4 right-4 z-20 flex gap-2">
            {canManage && (
              <button onClick={handleDelete} title="Eliminar Tarea" className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors shadow-sm">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-background/50 backdrop-blur-md text-on-surface-variant flex items-center justify-center border border-outline-variant/20 hover:text-on-surface hover:bg-surface-container-highest transition-colors shadow-sm">
               ✕
            </button>
         </div>

         {/* Portada Header */}
         {task.image_url ? (
            <div className="w-full h-48 shrink-0 bg-surface-container-high bg-cover bg-center border-b border-surface-container-highest relative" style={{ backgroundImage: `url('${task.image_url}')` }}>
               <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
         ) : (
            <div className="w-full h-24 shrink-0 bg-gradient-to-br from-surface-container to-surface-container-high border-b border-surface-container-highest flex items-end justify-start px-6 pb-4">
              <span className="text-[10px] px-3 py-1 rounded-full bg-surface-bright text-on-surface border border-outline-variant/20 uppercase font-bold tracking-widest shadow-sm">
                 {task.status.replace('_', ' ')}
              </span>
            </div>
         )}
         
         {/* Scrollable Content */}
         <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-6 ${task.image_url ? '-mt-12 relative z-10' : ''}`}>
            
            {/* Status Mover Pill (Especial móvil: Mover sin Drag) */}
            <div className="flex bg-surface-container border border-outline-variant/20 rounded-xl p-1 shadow-inner mt-2 shrink-0 relative z-20">
               {(['pending', 'in_progress', 'completed'] as const).map(s => (
                  <button 
                     key={s}
                     disabled={isSubmitting}
                     onClick={async () => {
                        if (task.status !== s) {
                           setIsSubmitting(true);
                           await onUpdate(task.id, { status: s });
                           setIsSubmitting(false);
                        }
                     }}
                     className={`flex-1 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${task.status === s ? 'bg-primary text-black shadow-lg scale-100 ring-2 ring-primary/50' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
                  >
                     {s.replace('_', ' ')}
                  </button>
               ))}
            </div>

            {/* Responsable Selector */}
            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Responsable</h3>
                  {isEditing && !canManage && (
                    <span className="text-[9px] text-error font-bold uppercase tracking-tighter flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Solo Admin / Propietario
                    </span>
                  )}
               </div>
               
               {isEditing ? (
                  <div className={`flex items-center gap-3 bg-surface-container rounded-lg border border-outline-variant/30 px-3 py-1.5 shadow-inner ${!canManage ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-outline-variant/20 bg-surface-container-high">
                      <img 
                        src={teamMembers.find(m => m.user_id === editedAssignedTo)?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editedAssignedTo || 'none'}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <select 
                      value={editedAssignedTo} 
                      onChange={(e) => setEditedAssignedTo(e.target.value)} 
                      disabled={!canManage}
                      className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-surface-container">Sin asignar</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.user_id} className="bg-surface-container">
                          {m.profile?.full_name || m.profile?.email} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
               ) : (
                  <div onClick={() => canManage && setIsEditing(true)} className={`flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/10 shadow-sm ${canManage ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 bg-surface-container-high">
                      <img 
                        src={task.assignee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_to || 'none'}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Asignado a</p>
                      <p className="font-semibold text-on-surface">{task.assignee?.full_name || 'Sin asignar'}</p>
                    </div>
                    {task.assignee?.full_name === 'Sin asignar' && canManage && (
                       <User className="ml-auto w-4 h-4 text-on-surface-variant/40" />
                    )}
                  </div>
               )}
            </div>
            
            <div className="flex flex-wrap gap-2">
               <span className="text-[10px] px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary uppercase font-bold tracking-widest border border-primary/20 shadow-sm">
                  {task.status.replace('_', ' ')}
               </span>
               {task.tags && task.tags.map(t => (
                  <TagBadge key={t.id} tag={t} />
               ))}
            </div>

            <div className="group relative">
              {isEditing ? (
                 <input autoFocus value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="text-2xl font-bold bg-transparent border-b border-primary/50 focus:outline-none text-on-surface w-full pb-1 focus:ring-0" />
              ) : (
                 <h2 onClick={() => isEditing && setIsEditing(true)} className="text-2xl font-bold text-on-surface leading-tight break-words border-b border-transparent pb-1 transition-colors">
                   {task.title}
                 </h2>
              )}
            </div>

            {task.due_date && (
               <div className="flex items-center gap-3 text-sm text-on-surface-variant bg-surface-container p-3 rounded-xl border border-outline-variant/10 shadow-inner">
                 <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-error/80">Plazo / Límite</p>
                   <p className="font-semibold text-on-surface">{new Date(task.due_date).toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
               </div>
            )}

            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Etiquetas / Categorías</h3>
                  {!isEditing && canManage && (
                     <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider">Gestionar</button>
                  )}
               </div>
               
               {isEditing ? (
                  <TagSelector selectedTagIds={editedTagIds} onChange={setEditedTagIds} teamId={teamId} />
               ) : (
                  <div 
                     onClick={() => canManage && setIsEditing(true)} 
                     className={`flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 transition-all items-center ${canManage ? 'hover:border-primary/50 cursor-pointer' : ''}`}
                  >
                     {task.tags && task.tags.length > 0 ? (
                        task.tags.map(t => <TagBadge key={t.id} tag={t} />)
                     ) : (
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/60 font-medium px-2">
                           {canManage && <Plus className="w-3 h-3 text-primary" />}
                           <span>{canManage ? 'Añadir etiquetas o categorías...' : 'Sin etiquetas'}</span>
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="flex flex-col gap-2 mt-1">
               <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Descripción Larga</h3>
                  {!isEditing && canManage && (
                     <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider">Editar Texto</button>
                  )}
               </div>
               
               {isEditing ? (
                  <textarea value={editedDesc} onChange={e => setEditedDesc(e.target.value)} rows={8} className="w-full p-4 bg-surface-container rounded-xl border border-primary/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface resize-none leading-relaxed shadow-inner" placeholder="Escribe especificaciones, enlaces, notas..." />
               ) : (
                  <div onClick={() => canManage && setIsEditing(true)} className={`text-sm text-on-surface/80 leading-relaxed whitespace-pre-wrap min-h-[150px] bg-surface-container-lowest p-3 rounded-xl border border-transparent transition-colors ${canManage ? 'cursor-text hover:border-outline-variant/20' : ''}`}>
                     {task.description || <span className="text-on-surface-variant/50 italic">Sin descripción general.</span>}
                  </div>
               )}
            </div>

            {/* SECCIÓN DE COMENTARIOS (HILOS) */}
            <div className="flex flex-col gap-4 mt-4 border-t border-outline-variant/10 pt-6">
               <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-sm uppercase font-bold text-on-surface tracking-wider">Actividad y Comentarios</h3>
               </div>

               {/* Lista de Comentarios */}
               <div className="flex flex-col gap-6">
                  {isLoadingComments ? (
                     <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                     </div>
                  ) : comments.length > 0 ? (
                     comments.map(comment => (
                        <div key={comment.id} className="flex flex-col gap-3">
                           {/* Comentario Principal */}
                           <CommentItem 
                              comment={comment} 
                              onReply={() => setReplyingTo(comment)}
                              onDelete={() => handleDeleteComment(comment.id)}
                              currentUserId={currentUserId}
                           />
                           
                           {/* Respuestas (Anidadas) */}
                           {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-10 flex flex-col gap-4 border-l-2 border-outline-variant/10 pl-4">
                                 {comment.replies.map(reply => (
                                    <CommentItem 
                                       key={reply.id} 
                                       comment={reply}
                                       onDelete={() => handleDeleteComment(reply.id)}
                                       currentUserId={currentUserId}
                                       isReply
                                    />
                                 ))}
                              </div>
                           )}
                        </div>
                     ))
                  ) : (
                     <p className="text-xs text-on-surface-variant/50 italic py-4">No hay comentarios aún. ¡Sé el primero en decir algo!</p>
                  )}
               </div>

               {/* Input de Nuevo Comentario */}
               <form onSubmit={handleAddComment} className="flex flex-col gap-3 bg-surface-container p-4 rounded-2xl border border-outline-variant/20 mt-2">
                  {replyingTo && (
                     <div className="flex items-center justify-between bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                        <p className="text-[10px] text-primary font-bold uppercase flex items-center gap-2">
                           <Reply className="w-3 h-3" /> Respondiendo a {replyingTo.profile?.full_name || replyingTo.profile?.email}
                        </p>
                        <button type="button" onClick={() => setReplyingTo(null)} className="text-[10px] text-on-surface-variant hover:text-error transition-colors">✕ Cancelar</button>
                     </div>
                  )}
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant/20">
                        <img 
                           src={teamMembers.find(m => m.user_id === currentUserId)?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`} 
                           alt="Tú" 
                           className="w-full h-full object-cover" 
                        />
                     </div>
                     <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        rows={2}
                        className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none resize-none"
                     />
                  </div>
                  <div className="flex justify-end pt-2 border-t border-outline-variant/10">
                     <button 
                        type="submit" 
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-primary text-black font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                     >
                        <Send className="w-3 h-3" />
                        Publicar
                     </button>
                  </div>
               </form>
            </div>
         </div>

         {/* Fixed Footer for Save Action */}
         {isEditing && (
            <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex justify-end gap-3 shrink-0 animate-in slide-in-from-bottom-5 fade-in duration-200 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
               <button onClick={() => { setIsEditing(false); setEditedTitle(task.title); setEditedDesc(task.description||''); setEditedAssignedTo(task.assigned_to || ''); }} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Cancelar</button>
               <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gradient-to-br from-primary to-primary-dim text-black shadow-[0_4px_14px_rgba(151,169,255,0.3)] hover:shadow-[0_6px_20px_rgba(151,169,255,0.4)] disabled:opacity-50 transition-all flex items-center gap-2">
                  {isSubmitting ? (
                     <>⏳ Guardando...</>
                  ) : (
                     <>✓ Guardar Cambios</>
                  )}
               </button>
            </div>
         )}
         </div>
      </div>
    </>
   )
}

function CommentItem({ 
   comment, 
   onReply, 
   onDelete, 
   currentUserId, 
   isReply = false 
}: { 
   comment: TaskComment, 
   onReply?: () => void, 
   onDelete: () => void, 
   currentUserId: string,
   isReply?: boolean
}) {
   const isAuthor = comment.user_id === currentUserId;

   return (
      <div className="flex gap-3 group/comment">
         <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant/20 ${isReply ? 'scale-90' : ''}`}>
            <img 
               src={comment.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} 
               alt="Avatar" 
               className="w-full h-full object-cover" 
            />
         </div>
         <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-bold text-on-surface">
                  {comment.profile?.full_name || comment.profile?.email}
               </span>
               <span className="text-[9px] text-on-surface-variant/60 font-medium flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(comment.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
            <div className="bg-surface-container-high px-4 py-2.5 rounded-2xl rounded-tl-none border border-outline-variant/10">
               <p className="text-sm text-on-surface/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
            <div className="flex items-center gap-4 mt-0.5 ml-1">
               {!isReply && onReply && (
                  <button onClick={onReply} className="text-[9px] font-black uppercase tracking-tighter text-primary hover:underline flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                     <Reply className="w-3 h-3" /> Responder
                  </button>
               )}
               {isAuthor && (
                  <button onClick={onDelete} className="text-[9px] font-black uppercase tracking-tighter text-on-surface-variant hover:text-error flex items-center gap-1 opacity-0 group-hover/comment:opacity-40 hover:!opacity-100 transition-opacity">
                     <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
               )}
            </div>
         </div>
      </div>
   )
}
