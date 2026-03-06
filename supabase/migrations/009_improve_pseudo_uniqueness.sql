-- =============================================================================
-- MIGRATION 009 — Amélioration de l'unicité du pseudo
-- =============================================================================
-- Améliore la fonction handle_new_user() pour mieux gérer les collisions
-- de pseudo lors de la création de profil.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _pseudo TEXT;
  _base_pseudo TEXT;
  _avatar TEXT;
  _suffix TEXT;
  _counter INTEGER := 0;
BEGIN
  -- Récupérer les infos depuis les metadata Google OAuth
  _pseudo := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  _avatar := NEW.raw_user_meta_data ->> 'avatar_url';
  _base_pseudo := _pseudo;

  -- S'assurer que le pseudo est unique en ajoutant un suffixe si nécessaire
  -- On essaie jusqu'à trouver un pseudo unique (max 10 tentatives)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE pseudo = _pseudo) AND _counter < 10 LOOP
    _counter := _counter + 1;
    _suffix := '_' || LEFT(NEW.id::TEXT, 4);
    IF _counter > 1 THEN
      _suffix := _suffix || _counter::TEXT;
    END IF;
    _pseudo := _base_pseudo || _suffix;
  END LOOP;
  
  -- Si toujours pas unique après 10 tentatives, utiliser l'UUID complet
  IF EXISTS (SELECT 1 FROM public.profiles WHERE pseudo = _pseudo) THEN
    _pseudo := _base_pseudo || '_' || REPLACE(NEW.id::TEXT, '-', '');
  END IF;

  INSERT INTO public.profiles (id, pseudo, avatar_url)
  VALUES (NEW.id, _pseudo, _avatar);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
