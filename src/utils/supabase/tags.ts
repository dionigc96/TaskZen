import { createClient } from '@/utils/supabase/client';
import { Tag } from '@/types';

const supabase = createClient();

export async function fetchUserTags(): Promise<Tag[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data || [];
}

export async function createTag(name: string, color: string = '#3b82f6', parentId: string | null = null): Promise<Tag | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tags')
    .insert([
      { name, color, parent_id: parentId, user_id: user.id }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    return null;
  }

  return data;
}

export async function updateTag(id: string, updates: Partial<Tag>): Promise<Tag | null> {
  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tag:', error);
    return null;
  }

  return data;
}

export async function deleteTag(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting tag:', error);
    return false;
  }

  return true;
}

export async function assignTagsToTask(taskId: string, tagIds: string[]): Promise<boolean> {
  // First delete existing assignments
  const { error: deleteError } = await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', taskId);

  if (deleteError) {
    console.error('Error removing old tags:', deleteError);
    return false;
  }

  if (tagIds.length === 0) return true;

  // Insert new ones
  const { error: insertError } = await supabase
    .from('task_tags')
    .insert(tagIds.map(tagId => ({ task_id: taskId, tag_id: tagId })));

  if (insertError) {
    console.error('Error assigning tags:', insertError);
    return false;
  }

  return true;
}

// Utility to build a hierarchical tree from a flat list
export function buildTagTree(tags: Tag[]): (Tag & { children: any[] })[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  tags.forEach(tag => {
    map.set(tag.id, { ...tag, children: [] });
  });

  tags.forEach(tag => {
    const node = map.get(tag.id);
    if (tag.parent_id && map.has(tag.parent_id)) {
      map.get(tag.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
