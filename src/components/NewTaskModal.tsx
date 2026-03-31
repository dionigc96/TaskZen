'use client'

import { useState } from 'react'

export function NewTaskModal({ 
   isOpen, 
   onClose, 
   onSubmit 
}: { 
   isOpen: boolean, 
   onClose: () => void, 
   onSubmit: (data: any) => Promise<void> 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        due_date: dueDate || null,
        image_url: imageMode === 'url' ? imageUrl : null,
        upload_file: imageMode === 'upload' ? imageFile : null
      });
      // Limpiar state al terminar
      setTitle('');
      setDescription('');
      setDueDate('');
      setImageUrl('');
      setImageFile(null);
      setImageMode('url');
      onClose();
    } catch(err) {
      console.error(err)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/50 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-low rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-surface-container-high overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-surface-container-high bg-surface-container flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full scale-150" />
            <h2 className="text-lg font-bold text-on-surface relative z-10 tracking-tight">Crear Nueva Tarea</h2>
            <button type="button" onClick={onClose} className="relative z-10 text-on-surface-variant hover:text-error transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
           <div>
             <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Título</label>
             <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Rediseñar la landing page..." className="w-full px-4 py-2.5 bg-surface-container rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all shadow-inner" />
           </div>
           
           <div>
             <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Descripción Corta</label>
             <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Agrega contexto a esta tarea..." className="w-full px-4 py-2.5 bg-surface-container rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all shadow-inner resize-none" rows={3}></textarea>
           </div>
           
           <div>
             <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Límite / Fecha (Opcional)</label>
             <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 text-on-surface [color-scheme:dark] outline-none shadow-inner" />
           </div>

           <div className="border border-outline-variant/20 rounded-xl p-4 bg-surface-container mt-2">
             <div className="flex gap-4 mb-3 border-b border-outline-variant/10 pb-2">
                <button type="button" onClick={() => setImageMode('url')} className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${imageMode === 'url' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Link Ext.</button>
                <button type="button" onClick={() => setImageMode('upload')} className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${imageMode === 'upload' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Subir Archivo</button>
             </div>
             
             {imageMode === 'url' ? (
                <input type="url" placeholder="https://unsplash.com/foto.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs focus:border-primary focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all" />
             ) : (
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:tracking-wider file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer file:transition-colors transition-colors" />
             )}
           </div>

           <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gradient-to-br from-primary to-primary-dim text-black hover:shadow-[0_0_20px_rgba(151,169,255,0.4)] disabled:opacity-50 transition-all">
                {isSubmitting ? 'Guardando...' : 'Añadir al Tablero'}
              </button>
           </div>
        </form>
      </div>
    </div>
  )
}
