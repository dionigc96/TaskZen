-- Migration: Team Collaboration & Roles
-- Date: 2026-04-07

-- 1. Create team_role enum
DO $$ BEGIN
    CREATE TYPE public.team_role AS ENUM ('admin', 'product_owner', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 4. Update tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6. Teams Policies
DO $$ BEGIN
    CREATE POLICY "Users can view teams they are members of"
      ON public.teams FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_id = teams.id AND user_id = auth.uid()
        )
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Owners can update their teams"
      ON public.teams FOR UPDATE
      USING ( owner_id = auth.uid() );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. Team Members Policies
DO $$ BEGIN
    CREATE POLICY "Team members are viewable by other members"
      ON public.team_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.team_members AS current_member
          WHERE current_member.team_id = team_members.team_id AND current_member.user_id = auth.uid()
        )
      );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 8. Update Tasks RLS for team-based access
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view tasks in their teams"
  ON public.tasks FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = tasks.team_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert tasks to their teams"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      team_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = tasks.team_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update tasks in their teams"
  ON public.tasks FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = tasks.team_id AND user_id = auth.uid() AND role IN ('admin', 'product_owner')
    ) OR
    (assigned_to = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = tasks.team_id AND user_id = auth.uid() AND role IN ('admin', 'product_owner')
    )
  );

-- 9. Auto-create personal team for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_team()
RETURNS TRIGGER AS $$
DECLARE
    new_team_id UUID;
BEGIN
    -- Create personal team
    INSERT INTO public.teams (name, owner_id)
    VALUES (new.email || '''s Team', new.id)
    RETURNING id INTO new_team_id;

    -- Add user as admin of their own team
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, new.id, 'admin');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;
CREATE TRIGGER on_auth_user_created_team
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_team();

-- 10. (Seed) Create teams for existing users and link existing tasks
DO $$
DECLARE
    prof RECORD;
    new_team_id UUID;
BEGIN
    FOR prof IN SELECT id, email FROM public.profiles LOOP
        -- Only if they don't have a team yet
        IF NOT EXISTS (SELECT 1 FROM public.teams WHERE owner_id = prof.id) THEN
            INSERT INTO public.teams (name, owner_id)
            VALUES (prof.email || '''s Team', prof.id)
            RETURNING id INTO new_team_id;

            INSERT INTO public.team_members (team_id, user_id, role)
            VALUES (new_team_id, prof.id, 'admin');

            -- Link their tasks to this new team
            UPDATE public.tasks SET team_id = new_team_id WHERE user_id = prof.id;
        END IF;
    END LOOP;
END $$;
