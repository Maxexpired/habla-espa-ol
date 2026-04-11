-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view team members
CREATE POLICY "Anyone can view team members"
ON public.team_members
FOR SELECT
TO anon, authenticated
USING (true);

-- Admins can do anything
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create team-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('team-images', 'team-images', true);

-- Public read access
CREATE POLICY "Public can view team images"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-images');

-- Admins can upload
CREATE POLICY "Admins can upload team images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update team images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete team images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));