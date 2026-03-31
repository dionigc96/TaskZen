"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, Profile } from '@/types';
import { Trash, Search, Plus } from 'lucide-react';
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

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pending', title: 'Pending', color: 'bg-secondary' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'completed', title: 'Completed', color: 'bg-tertiary' },
];

const supabase = createClient();

// Reusable Task Renderer
function TaskCardRenderer({ task, globalAvatar, isDragging, onClick, onDelete }: { task: Task, globalAvatar: string, isDragging?: boolean, onClick?: () => void, onDelete?: (id: string) => void }) {
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
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex gap-2 items-center flex-wrap">
             <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-bright text-on-surface-variant border border-outline-variant/20 uppercase font-bold tracking-widest shrink-0">
               {task.tags?.[0] || 'Task'}
             </span>
             {task.due_date && (
               <span className={`text-[10px] font-semibold flex items-center gap-1.5 shrink-0 ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {new Date(task.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
               </span>
             )}
          </div>
          <div title="Task Owner" className="w-5 h-5 shrink-0 rounded-full bg-secondary-container bg-cover bg-center ring-1 ring-background ml-1" style={{ backgroundImage: `url('${globalAvatar}')` }} />
        </div>
      </div>
    </div>
  );
}

// Draggable + Sortable wrapper
function SortableTaskCard({ task, globalAvatar, onTaskClick, onDeleteTask }: { task: Task, globalAvatar: string, onTaskClick: () => void, onDeleteTask: (id: string) => void }) {
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
      <TaskCardRenderer task={task} globalAvatar={globalAvatar} isDragging={isDragging} onClick={onTaskClick} onDelete={onDeleteTask} />
    </div>
  );
}

// Column container with Context
function KanbanColumn({ column, tasks, globalAvatar, onTaskClick, onDeleteTask }: { column: typeof COLUMNS[0], tasks: Task[], globalAvatar: string, onTaskClick: (t: Task) => void, onDeleteTask: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
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
             <SortableTaskCard key={task.id} task={task} globalAvatar={globalAvatar} onTaskClick={() => onTaskClick(task)} onDeleteTask={onDeleteTask} />
           ))}
         </SortableContext>
       </div>
    </div>
  );
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('default_dioni_seed');
  
  // Nuevo UI State para Inspeccionar tareas
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nuevo Estado Global de Sesión y Perfil
  const [sessionProfile, setSessionProfile] = useState<Profile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
         setCurrentUserId(user.id);
         const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         if (prof) setSessionProfile(prof);
      }
    });
  }, []);

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
    // Buscamos al usuario autenticado para relacionar la tarea a su cuenta de Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Debes iniciar sesión para crear tareas.");
        return;
    }

    let finalImageUrl = data.image_url;

    // Supabase Storage upload check
    if (data.upload_file) {
        const file = data.upload_file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('task-images').upload(fileName, file);
        if (uploadError) {
           console.error("Error uploading file to storage", uploadError);
           alert("Hubo un problema procesando la imagen local.");
           return;
        }

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
         status: 'pending'
      }
    ]).select().single();
    
    if (error) {
      console.error("No se pudo crear la tarea en DB:", error);
      alert("Error al intentar guardar la tarea.");
      return;
    }
    
    if (newTask) {
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleUpdateSelectedTask = async (id: string, partial: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(partial).eq('id', id);
    if (error) {
       console.error(error);
       alert("Error actualizando la tarea en la base de datos.");
       return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...partial } : t));
    setSelectedTask(prev => prev && prev.id === id ? { ...prev, ...partial } : prev);
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
       console.error(error);
       alert("Error al intentar eliminar la tarea.");
       return;
    }
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

    // Moving a task over another task
    if (isActiveATask && isOverATask) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        const overIndex = currentTasks.findIndex(t => t.id === overId);
        
        // If they are in different columns, move it to the new column immediately
        if (currentTasks[activeIndex].status !== currentTasks[overIndex].status) {
          const newTasks = [...currentTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: currentTasks[overIndex].status };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        
        // If same column, just reorder
        return arrayMove(currentTasks, activeIndex, overIndex);
      });
    }

    // Moving a task over an empty text Column area
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
    
    // UI state is already updated optimally in HandleDragOver.
    // Sync the status of the dragged task to Supabase
    const droppedTask = tasks.find(t => t.id === active.id);
    if (droppedTask) {
      // Background Sync to Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ status: droppedTask.status })
        .eq('id', droppedTask.id);
        
      if (error) console.error("Database sync failed", error);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navbar */}
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
               placeholder="Search tasks..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent border border-outline-variant/30 text-on-surface text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-black px-4 py-2 rounded-md font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Task</span>
          </button>
          
          <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-5 border-l border-outline-variant/20 ml-1">
             <ThemeSwitcher />
             <div onClick={() => setIsProfileModalOpen(true)} title="Ver Perfil" className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-outline-variant/30 hover:border-primary/60 cursor-pointer overflow-hidden transition-colors shadow-sm">
                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </header>

      {/* Board Layout */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start">
          {COLUMNS.map(col => {
            const filteredTasks = tasks.filter(t => 
               t.status === col.id && 
               (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
            );
            return (
               <KanbanColumn key={col.id} column={col} tasks={filteredTasks} globalAvatar={userAvatarUrl} onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} />
            );
          })}
          <div className="w-8 shrink-0" />
        </div>
        
        {/* Drag Overlay for smooth visual projection */}
        <DragOverlay>
           {activeTask ? (
             <div className="rotate-2 scale-105 cursor-grabbing opacity-90 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-1 ring-primary/50 rounded-lg">
                <TaskCardRenderer task={activeTask} globalAvatar={userAvatarUrl} />
             </div>
           ) : null}
        </DragOverlay>
      </DndContext>
      
      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleNewTask} 
      />

      {/* Modal Interactivo de Perfil */}
      <ProfileModal 
         isOpen={isProfileModalOpen} 
         profile={sessionProfile} 
         onClose={() => setIsProfileModalOpen(false)} 
         onUpdateProfile={handleUpdateProfile} 
         onLogout={handleLogout} 
      />

      {/* Visor Extendido de Tarea (Side Drawer) */}
      <TaskDetailPanel 
         isOpen={!!selectedTask}
         task={selectedTask}
         onClose={() => setSelectedTask(null)}
         onUpdate={handleUpdateSelectedTask}
         onDelete={handleDeleteTask}
      />
    </div>
  );
}
