-- Add dice_skin column to profiles
-- Stores the folder name of the selected dice skin (e.g. 'gold-ruby')
-- NULL means default (CSS-rendered) dice
ALTER TABLE profiles ADD COLUMN dice_skin TEXT DEFAULT NULL;
