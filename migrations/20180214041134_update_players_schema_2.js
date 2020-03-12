exports.up = function(knex) {
  return knex.raw(`Update players SET
		instastats = json_build_array(
			instastats::json->0,
			instastats::json->1,
			instastats::json->2,
			instastats::json->3,
			(instastats::json->5)::TEXT::NUMERIC * (instastats::json->0)::TEXT::NUMERIC
		), efficstats = json_build_array(
			efficstats::jsonb->0,
			efficstats::json->1,
			efficstats::json->2,
			efficstats::json->3,
			(efficstats::json->5)::TEXT::NUMERIC * (efficstats::json->0)::TEXT::NUMERIC
		)`);
};

exports.down = function(knex) {
  return knex.raw(`Update players SET
		instastats = json_build_array(
			instastats::json->0,
			instastats::json->1,
			instastats::json->2,
			instastats::json->3,
			(instastats::json->0)::TEXT::NUMERIC / (instastats::jsonb->2)::TEXT::NUMERIC,
			(instastats::json->5)::TEXT::NUMERIC / (instastats::jsonb->0)::TEXT::NUMERIC
		), efficstats = json_build_array(
			efficstats::json->0,
			efficstats::json->1,
			efficstats::json->2,
			efficstats::json->3,
			(efficstats::json->0)::TEXT::NUMERIC / (efficstats::jsonb->2)::TEXT::NUMERIC,
			(efficstats::json->5)::TEXT::NUMERIC / (efficstats::json->0)::TEXT::NUMERIC
		)`);
};
