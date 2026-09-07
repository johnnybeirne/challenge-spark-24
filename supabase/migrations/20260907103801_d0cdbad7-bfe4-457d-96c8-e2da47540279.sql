create or replace function public.get_pipeline_scorecard_response(p_id uuid)
returns public.pipeline_scorecard_responses
language sql
security definer
set search_path = public
as $$
  select * from public.pipeline_scorecard_responses where id = p_id
$$;

grant execute on function public.get_pipeline_scorecard_response(uuid) to anon, authenticated;

-- Remove the blanket public read rule so submissions can only be fetched one-by-one by id via the function.
drop policy if exists "Anyone can read a scorecard response by id" on public.pipeline_scorecard_responses;