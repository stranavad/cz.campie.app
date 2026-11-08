-- Custom fields now say whether they are health data. Every field saved before is not: mark it so in the
-- drafts and in the published versions, whose meaning this leaves unchanged.
UPDATE registration_forms
SET draft = jsonb_set(
  draft,
  '{custom}',
  (
    SELECT coalesce(jsonb_agg(field || '{"health": false}'::jsonb ORDER BY position), '[]'::jsonb)
    FROM jsonb_array_elements(draft -> 'custom') WITH ORDINALITY AS fields (field, position)
  )
)
WHERE jsonb_typeof(draft -> 'custom') = 'array';
--> statement-breakpoint
UPDATE registration_form_versions
SET definition = jsonb_set(
  definition,
  '{custom}',
  (
    SELECT coalesce(jsonb_agg(field || '{"health": false}'::jsonb ORDER BY position), '[]'::jsonb)
    FROM jsonb_array_elements(definition -> 'custom') WITH ORDINALITY AS fields (field, position)
  )
)
WHERE jsonb_typeof(definition -> 'custom') = 'array';
