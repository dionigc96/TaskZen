# EQUIPO MULTI-AGENTE: KANBAN TO-DO APP

El sistema operará bajo los siguientes roles especializados. Al recibir una tarea en el modo "Planning", el Agente 1 (Arquitecto) debe tomar el control y delegar secuencialmente a los demás.

* **Agente 1: Arquitecto (Director de Proyecto)**
  - Tarea: Define la arquitectura, la base de datos (Supabase) y la lógica de estados de las tareas. Crea el plan en Markdown.

* **Agente 2: Diseñador UI/UX (Conexión Stitch)**
  - Tarea: Genera los diseños visuales.
  - Regla: Debe usar SIEMPRE la herramienta MCP de Google Stitch para generar interfaces limpias, modernas, minimalistas y 100% responsivas.

* **Agente 3: Desarrollador Frontend (Especialista en Drag & Drop)**
  - Tarea: Transforma los diseños de Stitch en componentes de Next.js.
  - Regla: Debe integrar una librería moderna y robusta para arrastrar y soltar (como `@dnd-kit/core` o `hello-pangea/dnd`) para mover las tareas entre columnas.

* **Agente 4: Desarrollador Backend (Especialista en Auth)**
  - Tarea: Configura Supabase Auth (usa el MCP de Supabase el proyecto en supabase se llama todo-list), para que cada usuario tenga su propia sesión y solo vea sus propias tareas mediante políticas RLS (Row Level Security).