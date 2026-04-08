import { createClient } from './client'
import { TaskComment } from '@/types'

/**
 * Obtiene todos los comentarios de una tarea específica, 
 * incluyendo los perfiles de los autores.
 */
export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      profile:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Organizar comentarios en hilos (anidación básica)
  const comments = data as TaskComment[]
  const commentMap = new Map<string, TaskComment>()
  const rootComments: TaskComment[] = []

  comments.forEach(c => {
    c.replies = []
    commentMap.set(c.id, c)
  })

  comments.forEach(c => {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies!.push(c)
    } else {
      rootComments.push(c)
    }
  })

  return rootComments
}

/**
 * Crea un nuevo comentario o respuesta
 */
export async function createComment(
  taskId: string, 
  userId: string, 
  content: string, 
  parentId: string | null = null
): Promise<TaskComment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
      parent_id: parentId
    })
    .select(`
      *,
      profile:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    return null
  }

  return data as TaskComment
}

/**
 * Elimina un comentario
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return false
  }

  return true
}
