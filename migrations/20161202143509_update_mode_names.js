exports.up = function(knex) {
  return knex.raw(`
UPDATE games SET
    gamemode = c.new_name
FROM (values
    ('coop', 'coop_edit'),
    ('insta', 'instagib'),
    ('instateam', 'insta_team'),
    ('effic', 'efficiency'),
    ('efficteam', 'effic_team'),
    ('tac', 'tactics'),
    ('tacteam', 'tac_team'),
    ('rcapture', 'regen_capture'),
    ('ictf', 'insta_ctf'),
    ('iprotect', 'insta_protect'),
    ('ihold', 'insta_hold'),
    ('ectf', 'effic_ctf'),
    ('eprotect', 'effic_protect'),
    ('ehold', 'effic_hold'),
    ('icollect', 'insta_collect'),
    ('ecollect', 'effic_collect')
) AS c(old_name, new_name)
WHERE c.old_name = games.gamemode
	`);
};

exports.down = function(knex) {
  return knex.raw(`
UPDATE games SET
    gamemode = c.new_name
FROM (values
    ('coop_edit', 'coop'),
    ('instagib', 'insta'),
    ('insta_team', 'instateam'),
    ('efficiency', 'effic'),
    ('effic_team', 'efficteam'),
    ('tactics', 'tac'),
    ('tac_team', 'tacteam'),
    ('regen_capture', 'rcapture'),
    ('insta_ctf', 'ictf'),
    ('insta_protect', 'iprotect'),
    ('insta_hold', 'ihold'),
    ('effic_ctf', 'ectf'),
    ('effic_protect', 'eprotect'),
    ('effic_hold', 'ehold'),
    ('insta_collect', 'icollect'),
    ('effic_collect', 'ecollect')
) AS c(old_name, new_name)
WHERE c.old_name = games.gamemode
	`);
};
