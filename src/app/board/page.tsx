import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching tasks', error);
  }

  return (
    <main className="min-h-screen bg-background text-on-surface font-sans">
      <KanbanBoard initialTasks={tasks || []} />
    </main>
  );
}
