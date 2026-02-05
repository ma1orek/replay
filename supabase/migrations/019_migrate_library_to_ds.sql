-- =============================================
-- MIGRATION: Library Data to Design Systems
-- Migration: 019_migrate_library_to_ds.sql
-- 
-- This migration creates Design Systems from existing library_data
-- stored in the generations table.
-- =============================================

-- Function to migrate a single generation's library_data to a Design System
-- NOTE: p_generation_id is TEXT because generations.id is TEXT
CREATE OR REPLACE FUNCTION public.migrate_generation_library_to_ds(
  p_generation_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_gen RECORD;
  v_ds_id UUID;
  v_user_has_ds BOOLEAN;
  v_comp JSONB;
  v_comp_name TEXT;
BEGIN
  -- Get generation record
  SELECT * INTO v_gen
  FROM public.generations
  WHERE id = p_generation_id
  AND library_data IS NOT NULL
  AND library_data != '{}'::jsonb
  AND library_data != 'null'::jsonb;
  
  IF NOT FOUND THEN
    RETURN NULL; -- No library data to migrate
  END IF;
  
  -- Check if user already has a design system
  SELECT EXISTS(
    SELECT 1 FROM public.design_systems 
    WHERE user_id = v_gen.user_id
  ) INTO v_user_has_ds;
  
  -- Create or find a Design System for this user
  IF NOT v_user_has_ds THEN
    -- Create first Design System for user (will be default)
    INSERT INTO public.design_systems (
      user_id,
      name,
      source_type,
      tokens,
      is_default,
      is_public
    )
    VALUES (
      v_gen.user_id,
      COALESCE(v_gen.title, 'My Design System'),
      'video',
      COALESCE(v_gen.library_data->'tokens', '{}'::jsonb),
      true,
      false
    )
    RETURNING id INTO v_ds_id;
  ELSE
    -- Get the default Design System for this user
    SELECT id INTO v_ds_id
    FROM public.design_systems
    WHERE user_id = v_gen.user_id
    AND is_default = true
    LIMIT 1;
    
    -- If no default, get any design system
    IF v_ds_id IS NULL THEN
      SELECT id INTO v_ds_id
      FROM public.design_systems
      WHERE user_id = v_gen.user_id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;
  
  -- Link generation to design system
  UPDATE public.generations
  SET design_system_id = v_ds_id
  WHERE id = p_generation_id;
  
  -- Migrate components from library_data to design_system_components
  -- Handle 'components' array
  IF v_gen.library_data->'components' IS NOT NULL THEN
    FOR v_comp IN SELECT * FROM jsonb_array_elements(v_gen.library_data->'components')
    LOOP
      v_comp_name := v_comp->>'name';
      
      -- Skip if component with this name already exists in DS
      IF NOT EXISTS (
        SELECT 1 FROM public.design_system_components
        WHERE design_system_id = v_ds_id AND name = v_comp_name
      ) THEN
        INSERT INTO public.design_system_components (
          design_system_id,
          name,
          layer,
          category,
          code,
          variants,
          props,
          docs,
          source_generation_id,
          is_approved,
          usage_count
        )
        VALUES (
          v_ds_id,
          v_comp_name,
          COALESCE(v_comp->>'layer', 'components'),
          v_comp->>'category',
          COALESCE(v_comp->>'code', ''),
          COALESCE(v_comp->'variants', '[]'::jsonb),
          COALESCE(v_comp->'props', '[]'::jsonb),
          COALESCE(v_comp->'docs', '{}'::jsonb),
          p_generation_id,
          true,
          0
        )
        ON CONFLICT (design_system_id, name) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  -- Also migrate primitives, patterns, product layers if present
  IF v_gen.library_data->'primitives' IS NOT NULL THEN
    FOR v_comp IN SELECT * FROM jsonb_array_elements(v_gen.library_data->'primitives')
    LOOP
      v_comp_name := v_comp->>'name';
      IF NOT EXISTS (
        SELECT 1 FROM public.design_system_components
        WHERE design_system_id = v_ds_id AND name = v_comp_name
      ) THEN
        INSERT INTO public.design_system_components (
          design_system_id, name, layer, category, code, variants, props, docs, source_generation_id, is_approved, usage_count
        )
        VALUES (
          v_ds_id, v_comp_name, 'primitives', v_comp->>'category',
          COALESCE(v_comp->>'code', ''), COALESCE(v_comp->'variants', '[]'::jsonb),
          COALESCE(v_comp->'props', '[]'::jsonb), COALESCE(v_comp->'docs', '{}'::jsonb),
          p_generation_id, true, 0
        )
        ON CONFLICT (design_system_id, name) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  IF v_gen.library_data->'patterns' IS NOT NULL THEN
    FOR v_comp IN SELECT * FROM jsonb_array_elements(v_gen.library_data->'patterns')
    LOOP
      v_comp_name := v_comp->>'name';
      IF NOT EXISTS (
        SELECT 1 FROM public.design_system_components
        WHERE design_system_id = v_ds_id AND name = v_comp_name
      ) THEN
        INSERT INTO public.design_system_components (
          design_system_id, name, layer, category, code, variants, props, docs, source_generation_id, is_approved, usage_count
        )
        VALUES (
          v_ds_id, v_comp_name, 'patterns', v_comp->>'category',
          COALESCE(v_comp->>'code', ''), COALESCE(v_comp->'variants', '[]'::jsonb),
          COALESCE(v_comp->'props', '[]'::jsonb), COALESCE(v_comp->'docs', '{}'::jsonb),
          p_generation_id, true, 0
        )
        ON CONFLICT (design_system_id, name) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  IF v_gen.library_data->'product' IS NOT NULL THEN
    FOR v_comp IN SELECT * FROM jsonb_array_elements(v_gen.library_data->'product')
    LOOP
      v_comp_name := v_comp->>'name';
      IF NOT EXISTS (
        SELECT 1 FROM public.design_system_components
        WHERE design_system_id = v_ds_id AND name = v_comp_name
      ) THEN
        INSERT INTO public.design_system_components (
          design_system_id, name, layer, category, code, variants, props, docs, source_generation_id, is_approved, usage_count
        )
        VALUES (
          v_ds_id, v_comp_name, 'product', v_comp->>'category',
          COALESCE(v_comp->>'code', ''), COALESCE(v_comp->'variants', '[]'::jsonb),
          COALESCE(v_comp->'props', '[]'::jsonb), COALESCE(v_comp->'docs', '{}'::jsonb),
          p_generation_id, true, 0
        )
        ON CONFLICT (design_system_id, name) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_ds_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run full migration (call this to migrate all existing data)
-- NOTE: generation_id is TEXT because generations.id is TEXT
CREATE OR REPLACE FUNCTION public.run_library_to_ds_migration()
RETURNS TABLE(generation_id TEXT, design_system_id UUID, status TEXT) AS $$
DECLARE
  v_gen RECORD;
  v_ds_id UUID;
BEGIN
  -- Loop through all generations with library_data
  FOR v_gen IN 
    SELECT g.id, g.user_id, g.title
    FROM public.generations g
    WHERE g.library_data IS NOT NULL
    AND g.library_data != '{}'::jsonb
    AND g.library_data != 'null'::jsonb
    AND g.design_system_id IS NULL
    ORDER BY g.created_at ASC
  LOOP
    BEGIN
      v_ds_id := public.migrate_generation_library_to_ds(v_gen.id);
      
      IF v_ds_id IS NOT NULL THEN
        RETURN QUERY SELECT v_gen.id::TEXT, v_ds_id, 'migrated'::TEXT;
      ELSE
        RETURN QUERY SELECT v_gen.id::TEXT, NULL::UUID, 'skipped'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_gen.id::TEXT, NULL::UUID, ('error: ' || SQLERRM)::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION public.run_library_to_ds_migration() IS 
'Migrates existing library_data from generations table to the new Design Systems architecture.
Run SELECT * FROM public.run_library_to_ds_migration(); to execute the migration.
This is idempotent - it will skip generations already linked to a Design System.';
