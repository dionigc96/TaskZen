"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, Profile, Tag, Team, TeamMember } from '@/types';
import { Trash, Search, Plus, Tag as TagIcon, LayoutGrid, X } from 'lucide-react';
import { TagBadge } from './TagBadge';
import { TagSelector } from './TagSelector';
import { fetchUserTags, assignTagsToTask } from '@/utils/supabase/tags';
import { fetchUserTeams, fetchTeamMembers } from '@/utils/supabase/teams';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent, 
  DragOverEvent,
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/utils/supabase/client';
import { NewTaskModal } from './NewTaskModal';
import { TaskDetailPanel } from './TaskDetailPanel';
import { ProfileModal } from './ProfileModal';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CreateTeamModal } from './CreateTeamModal';
import { TeamSettingsModal } from './TeamSettingsModal';
import { Users, Settings } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pending', title: 'Pending', color: 'bg-secondary' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'completed', title: 'Completed', color: 'bg-tertiary' },
];

const supabase = createClient();

// Draggable + Sortable wrapper
function SortableTaskCard({ task, globalAvatar, onTaskClick, onDeleteTask, onTagClick, setIsOpeningWithTagsFocused }: { task: Task, globalAvatar: string, onTaskClick: () => void, onDeleteTask: (id: string) => void, onTagClick: (tagId: string) => void, setIsOpeningWithTagsFocused: (val: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });
  
  const style = { 
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCardRenderer task={task} globalAvatar={globalAvatar} isDragging={isDragging} onClick={onTaskClick} onDelete={onDeleteTask} onTagClick={onTagClick} setIsOpeningWithTagsFocused={setIsOpeningWithTagsFocused} />
    </div>
  );
}

// Reusable Task Renderer
function TaskCardRenderer({ task, globalAvatar, isDragging, onClick, onDelete, onTagClick, setIsOpeningWithTagsFocused }: { task: Task, globalAvatar: string, isDragging?: boolean, onClick?: () => void, onDelete?: (id: string) => void, onTagClick?: (tagId: string) => void, setIsOpeningWithTagsFocused?: (val: boolean) => void }) {
  const isOverdue = task.due_date ? new Date(task.due_date) < new Date() : false;

  return (
    <div onClick={onClick} className={`group relative bg-surface-container rounded-lg border shadow-sm flex flex-col overflow-hidden
      ${isDragging ? 'opacity-50 ring-2 ring-primary bg-surface-container-high border-primary/50' : 'border-outline-variant/15 hover:bg-surface-container-highest hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]'}
      transition-all cursor-pointer active:cursor-grabbing`}>
      
      {/* Quick Delete Overlay Button */}
      {onDelete && (
        <button 
           onClick={(e) => { 
              e.stopPropagation(); 
              if(window.confirm('¿Borrar esta tarea permanentemente?')) onDelete(task.id); 
           }}
           className="absolute top-2 right-2 w-7 h-7 rounded bg-background/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-error hover:border-error transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10 shadow-sm"
           title="Borrar rápidamente"
        >
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
      {task.image_url && (
         <div className="w-full h-32 bg-surface-container-high bg-cover bg-center shrink-0 border-b border-outline-variant/10" style={{ backgroundImage: `url('${task.image_url}')` }} />
      )}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-sm text-on-surface mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
        )}
        <div className="flex flex-col gap-2 mt-auto pt-2">
           <div className="flex gap-1 items-center flex-wrap">
              {task.tags && task.tags.map(t => (
                <div 
                  key={t.id} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onTagClick?.(t.id); 
                  }}
                >
                  <TagBadge tag={t} />
                </div>
              ))}
               <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     // Abre el panel directamente para editar etiquetas
                     setIsOpeningWithTagsFocused?.(true);
                     onClick?.();
                  }}
                  className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-sm"
                  title="Quick Assign Category"
               >
                 <Plus className="w-3 h-3" />
               </button>
            </div>
           <div className="flex items-center justify-between">
             {task.due_date && (
               <span className={`text-[10px] font-semibold flex items-center gap-1.5 shrink-0 ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {new Date(task.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
               </span>
             )}
             <div title={task.assignee?.full_name || 'Unassigned'} className="w-5 h-5 shrink-0 rounded-full bg-secondary-container bg-cover bg-center ring-1 ring-background ml-auto overflow-hidden">
               <img src={task.assignee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_to || task.user_id}`} alt="Assignee" className="w-full h-full object-cover" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// Column container with Context
function KanbanColumn({ column, tasks, globalAvatar, onTaskClick, onDeleteTask, onTagClick, setIsOpeningWithTagsFocused }: { column: { id: TaskStatus; title: string; color: string }, tasks: Task[], globalAvatar: string, onTaskClick: (t: Task) => void, onDeleteTask: (id: string) => void, onTagClick: (tagId: string) => void, setIsOpeningWithTagsFocused: (val: boolean) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id as string,
    data: { type: 'Column', column },
  });

  return (
    <div ref={setNodeRef} className={`flex flex-col w-[280px] sm:w-[320px] md:w-auto md:flex-1 shrink-0 gap-4 bg-surface-container-low rounded-xl p-4 min-h-[500px] border transition-colors ${isOver ? 'border-primary ring-1 ring-primary/20 bg-surface-container-high' : 'border-surface-container-high'}`}>
       <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${column.color} shadow-[0_0_8px] shadow-current`} />
           <h2 className="font-semibold text-on-surface uppercase tracking-wider text-xs">{column.title}</h2>
         </div>
         <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
           {tasks.length}
         </span>
       </div>
       
       <div className="flex flex-col gap-3 flex-1 min-h-[100px]">
         <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
           {tasks.map(task => (
             <SortableTaskCard key={task.id} task={task} globalAvatar={globalAvatar} onTaskClick={() => onTaskClick(task)} onDeleteTask={onDeleteTask} onTagClick={onTagClick} setIsOpeningWithTagsFocused={setIsOpeningWithTagsFocused} />
           ))}
         </SortableContext>
       </div>
    </div>
  );
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('default_dioni_seed');
  
  // UI State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpeningWithTagsFocused, setIsOpeningWithTagsFocused] = useState(false);
  const [groupBy, setGroupBy] = useState<'status' | 'tag'>('status');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  
  // Team & Member filtering state
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  
  const [sessionProfile, setSessionProfile] = useState<Profile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const router = useRouter();

  const currentUserRole = useMemo(() => {
    return teamMembers.find(m => m.user_id === currentUserId)?.role || 'member';
  }, [teamMembers, currentUserId]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
         setCurrentUserId(user.id);
         const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         if (prof) setSessionProfile(prof);
         
         const tags = await fetchUserTags();
         setAllTags(tags);

         const userTeams = await fetchUserTeams();
         setTeams(userTeams);
         if (userTeams.length > 0) {
            setSelectedTeamId(userTeams[0].id);
         }
      }
    });
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
       fetchTeamMembers(selectedTeamId).then(setTeamMembers);
       refreshTasksWithTags();
    }
  }, [selectedTeamId]);

  const refreshTasksWithTags = async () => {
    if (!selectedTeamId) return;

    const { data: tasksWithTags, error } = await supabase
      .from('tasks')
      .select('*, tags(*), assignee:profiles!tasks_assigned_to_fkey(*)')
      .eq('team_id', selectedTeamId);
    
    if (!error && tasksWithTags) {
       setTasks(tasksWithTags as Task[]);
       // Sync selected task if open
       if (selectedTask) {
          const updated = (tasksWithTags as Task[]).find(t => t.id === selectedTask.id);
          if (updated) setSelectedTask(updated);
       }
    }
  };

  const handleUpdateProfile = async (changes: Partial<Profile>) => {
    if (!sessionProfile) return;
    const { error } = await supabase.from('profiles').update(changes).eq('id', sessionProfile.id);
    if (!error) {
       setSessionProfile({ ...sessionProfile, ...changes });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const userAvatarUrl = sessionProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const activeTask = useMemo(() => tasks.find(t => t.id === activeId), [activeId, tasks]);

  const handleNewTask = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let finalImageUrl = data.image_url;
    if (data.upload_file) {
        const file = data.upload_file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        await supabase.storage.from('task-images').upload(fileName, file);
        const { data: publicData } = supabase.storage.from('task-images').getPublicUrl(fileName);
        finalImageUrl = publicData.publicUrl;
    }
    
    const { data: newTask, error } = await supabase.from('tasks').insert([
      { 
         title: data.title.trim(), 
         description: data.description || null,
         due_date: data.due_date || null,
         image_url: finalImageUrl || null,
         user_id: user.id, 
         status: 'pending',
         team_id: selectedTeamId,
         assigned_to: data.assigned_to || null
      }
    ]).select('*, tags(*), assignee:profiles!tasks_assigned_to_fkey(*)').single();
    
    if (newTask) {
      if (data.tag_ids && data.tag_ids.length > 0) {
        await assignTagsToTask(newTask.id, data.tag_ids);
      }
      refreshTasksWithTags();
    }
  };

  const handleUpdateTask = async (id: string, partial: Partial<Task & { tag_ids?: string[] }>) => {
    const { tag_ids, ...taskData } = partial;

    if (Object.keys(taskData).length > 0) {
      await supabase.from('tasks').update(taskData).eq('id', id);
    }
    
    if (tag_ids) {
      await assignTagsToTask(id, tag_ids);
    }

    await refreshTasksWithTags();
  };

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        const overIndex = currentTasks.findIndex(t => t.id === overId);
        if (currentTasks[activeIndex].status !== currentTasks[overIndex].status) {
          const newTasks = [...currentTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: currentTasks[overIndex].status };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(currentTasks, activeIndex, overIndex);
      });
    }

    if (isActiveATask && isOverAColumn) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        if (currentTasks[activeIndex].status !== overId) {
          const newTasks = [...currentTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as TaskStatus };
          return arrayMove(newTasks, activeIndex, activeIndex);
        }
        return currentTasks;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active } = event;
    const droppedTask = tasks.find(t => t.id === active.id);
    if (droppedTask) {
      await supabase.from('tasks').update({ status: droppedTask.status }).eq('id', droppedTask.id);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high backdrop-blur-md bg-surface/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-black font-extrabold text-lg flex items-center justify-center h-full pt-0.5">T</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-on-surface">TaskZen</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative pr-2 flex-1 sm:pr-4 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
               type="text" 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-outline-variant/30 text-on-surface text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
            />
          </div>

          <div className="flex bg-surface-container border border-outline-variant/20 rounded-lg p-0.5">
             <button onClick={() => setGroupBy('status')} className={`p-1.5 rounded-md transition-all ${groupBy === 'status' ? 'bg-primary text-black shadow-sm' : 'text-on-surface-variant'}`}><LayoutGrid className="w-4 h-4" /></button>
             <button onClick={() => setGroupBy('tag')} className={`p-1.5 rounded-md transition-all ${groupBy === 'tag' ? 'bg-primary text-black shadow-sm' : 'text-on-surface-variant'}`}><TagIcon className="w-4 h-4" /></button>
          </div>

          <button onClick={() => setIsTagManagerOpen(true)} className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-md font-medium border border-outline-variant/20"><TagIcon className="w-4 h-4" /> <span className="hidden sm:inline">Categorías</span></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-md font-medium shadow-lg shadow-primary/20 transition-shadow"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Task</span></button>
          
          <div className="flex items-center gap-4 pl-4 border-l border-outline-variant/20">
             <div className="hidden md:flex items-center gap-3 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/10 shadow-inner">
               <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-tighter">Equipo:</span>
                  <select 
                    value={selectedTeamId || ''} 
                    onChange={(e) => {
                      if (e.target.value === 'NEW_TEAM') {
                        setIsCreateTeamOpen(true);
                      } else {
                        setSelectedTeamId(e.target.value);
                      }
                    }}
                    className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer pr-4"
                  >
                    {teams.map(t => <option key={t.id} value={t.id} className="bg-surface-container text-on-surface">{t.name}</option>)}
                    <option value="NEW_TEAM" className="bg-surface-container text-primary font-bold">+ Nuevo Equipo</option>
                  </select>
               </div>
               
               {(currentUserRole === 'admin' || currentUserRole === 'product_owner') && (
                 <button 
                  onClick={() => setIsTeamSettingsOpen(true)}
                  className="p-1.5 rounded-md hover:bg-primary/20 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                  title="Gestionar Miembros"
                 >
                   <Users className="w-4 h-4" />
                 </button>
               )}
             </div>
             <ThemeSwitcher />
             <div onClick={() => setIsProfileModalOpen(true)} className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-outline-variant/30 cursor-pointer overflow-hidden"><img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>
          </div>
        </div>
      </header>

      {/* Advanced Filters Toolbar */}
      <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/10 flex items-center gap-6 overflow-x-auto scrollbar-hide shrink-0 shadow-sm">
        {/* Assignee Filter */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-on-surface-variant shrink-0">Responsable:</span>
          <div className="flex items-center -space-x-2">
            <button 
              onClick={() => setFilterAssigneeId(null)}
              className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-bold ${filterAssigneeId === null ? 'border-primary bg-primary text-black z-10 scale-110 shadow-md' : 'border-background bg-surface-container-high text-on-surface-variant hover:z-10 hover:scale-105'}`}
            >
              All
            </button>
            {teamMembers.map(m => (
              <button 
                key={m.id}
                onClick={() => setFilterAssigneeId(m.user_id)}
                title={m.profile?.full_name || m.profile?.email}
                className={`w-7 h-7 rounded-full border-2 transition-all overflow-hidden ${filterAssigneeId === m.user_id ? 'border-primary ring-2 ring-primary/20 z-10 scale-110 shadow-md' : 'border-background hover:z-10 hover:scale-105'}`}
              >
                <img src={m.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`} alt="Member" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 pl-6 border-l border-outline-variant/20">
          <span className="text-[10px] font-bold uppercase text-on-surface-variant shrink-0">Fecha:</span>
          <div className="flex bg-surface-container-high p-1 rounded-lg gap-1 border border-outline-variant/10">
            {(['all', 'today', 'week', 'overdue'] as const).map(range => (
              <button 
                key={range}
                onClick={() => setFilterDateRange(range)}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${filterDateRange === range ? 'bg-primary text-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters (Existing) */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-3 pl-6 border-l border-outline-variant/20 flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant shrink-0">Categoría:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {allTags.map(tag => {
                const isActive = filterTagIds.includes(tag.id);
                return (
                  <button key={tag.id} onClick={() => setFilterTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])} className={`px-2.5 py-1.5 rounded-full text-[9px] font-semibold transition-all flex items-center gap-1.5 border whitespace-nowrap ${isActive ? 'scale-105 shadow-md' : 'bg-surface-container-high text-on-surface-variant'}`} style={{ backgroundColor: isActive ? tag.color : undefined, color: isActive ? '#000' : undefined }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {filterTagIds.length > 0 && <button onClick={() => setFilterTagIds([])} className="ml-2 text-[10px] font-bold text-primary hover:underline uppercase shrink-0">Limpiar</button>}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start">
          {groupBy === 'status' ? (
            COLUMNS.map(col => {
              const filteredTasks = tasks.filter(t => {
                const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                const matchesTags = filterTagIds.length === 0 || t.tags?.some(tag => filterTagIds.includes(tag.id));
                const matchesAssignee = filterAssigneeId === null || t.assigned_to === filterAssigneeId;
                
                let matchesDate = true;
                if (filterDateRange !== 'all' && t.due_date) {
                  const d = new Date(t.due_date);
                  const now = new Date();
                  if (filterDateRange === 'today') matchesDate = d.toDateString() === now.toDateString();
                  else if (filterDateRange === 'week') {
                    const weekEnd = new Date(); weekEnd.setDate(now.getDate() + 7);
                    matchesDate = d >= now && d <= weekEnd;
                  }
                  else if (filterDateRange === 'overdue') matchesDate = d < now;
                } else if (filterDateRange !== 'all') {
                  matchesDate = false;
                }

                return t.status === col.id && matchesSearch && matchesTags && matchesAssignee && matchesDate;
              });
              return (<KanbanColumn key={col.id} column={col} tasks={filteredTasks} globalAvatar={userAvatarUrl} onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} onTagClick={(tagId) => setFilterTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])} setIsOpeningWithTagsFocused={setIsOpeningWithTagsFocused} />);
            })
          ) : (
            <>
              {allTags.map(tag => {
                const filteredTasks = tasks.filter(t => t.tags?.some(tagObj => tagObj.id === tag.id) && (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())));
                return (<KanbanColumn key={tag.id} column={{ id: tag.id as any, title: tag.name, color: '' }} tasks={filteredTasks} globalAvatar={userAvatarUrl} onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} onTagClick={(tagId) => setFilterTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])} setIsOpeningWithTagsFocused={setIsOpeningWithTagsFocused} />);
              })}
              {(() => {
                  const uncategorizedTasks = tasks.filter(t => (!t.tags || t.tags.length === 0) && (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())));
                  return (<KanbanColumn column={{ id: 'none' as any, title: 'No Tag', color: 'bg-outline-variant/30' }} tasks={uncategorizedTasks} globalAvatar={userAvatarUrl} onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} onTagClick={(tagId) => setFilterTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])} setIsOpeningWithTagsFocused={setIsOpeningWithTagsFocused} />);
              })()}
            </>
          )}
        </div>
        <DragOverlay>
           {activeTask ? (<div className="rotate-2 scale-105 opacity-90"><TaskCardRenderer task={activeTask} globalAvatar={userAvatarUrl} /></div>) : null}
        </DragOverlay>
      </DndContext>
      
      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleNewTask} 
        teamMembers={teamMembers}
      />
      
      {isTagManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsTagManagerOpen(false)} />
            <div className="relative w-full max-w-md bg-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl">
              <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between"><h2 className="text-lg font-bold text-on-surface">Categorías</h2><button onClick={() => setIsTagManagerOpen(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6">
                 <TagSelector selectedTagIds={[]} onChange={async () => {
                    const tags = await fetchUserTags();
                    setAllTags(tags);
                    refreshTasksWithTags();
                 }} />
              </div>
              <div className="p-4 flex justify-end"><button onClick={() => setIsTagManagerOpen(false)} className="px-6 py-2 bg-primary text-black font-bold uppercase text-[10px] rounded-lg">Listo</button></div>
           </div>
        </div>
      )}

      <ProfileModal isOpen={isProfileModalOpen} profile={sessionProfile} onClose={() => setIsProfileModalOpen(false)} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />
      <TaskDetailPanel 
        key={selectedTask?.id || 'none'} 
        isOpen={selectedTask !== null} 
        task={selectedTask} 
        autoEditTags={isOpeningWithTagsFocused} 
        onClose={() => { setSelectedTask(null); setIsOpeningWithTagsFocused(false); }} 
        onUpdate={handleUpdateTask} 
        onDelete={handleDeleteTask} 
        teamMembers={teamMembers}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />

      <CreateTeamModal 
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onTeamCreated={(team) => {
          setTeams(prev => [...prev, team]);
          setSelectedTeamId(team.id);
        }}
      />

      <TeamSettingsModal 
        isOpen={isTeamSettingsOpen}
        team={teams.find(t => t.id === selectedTeamId) || null}
        onClose={() => setIsTeamSettingsOpen(false)}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
