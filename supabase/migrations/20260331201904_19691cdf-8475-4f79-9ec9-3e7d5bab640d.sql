ALTER TABLE public.availability ADD COLUMN schedule_type text NOT NULL DEFAULT 'recurring';
ALTER TABLE public.availability ADD COLUMN specific_date text;