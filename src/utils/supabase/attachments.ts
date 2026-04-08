import { createClient } from './client';
import { Attachment } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAttachment(
  file: File,
  taskId?: string,
  commentId?: string
) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('El archivo supera el límite de 5MB');
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autenticado');

  // 1. Upload to Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('attachments')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // 2. Create DB entry
  const { data, error: dbError } = await supabase
    .from('attachments')
    .insert({
      task_id: taskId || null,
      comment_id: commentId || null,
      user_id: user.id,
      file_name: file.name,
      file_path: uploadData.path,
      file_type: file.type,
      size: file.size
    })
    .select()
    .single();

  if (dbError) {
    // Cleanup storage if DB fails
    await supabase.storage.from('attachments').remove([fileName]);
    throw dbError;
  }

  return data as Attachment;
}

export async function getAttachmentsByTask(taskId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Attachment[];
}

export async function getAttachmentsByComment(commentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Attachment[];
}

export async function deleteAttachment(attachment: Attachment) {
  const supabase = createClient();
  
  // 1. Delete from DB
  const { error: dbError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachment.id);

  if (dbError) throw dbError;

  // 2. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.file_path]);

  if (storageError) console.error('Error deleting file from storage:', storageError);
}

export async function getDownloadUrl(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(path, 3600); // 1 hour

  if (error) throw error;
  return data.signedUrl;
}
