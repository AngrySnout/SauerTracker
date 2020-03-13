export function getPort() {
  const variable = parseInt(process.env.PORT);
  return variable ? variable : 8080;
}

export function getBalancePort() {
  const variable = parseInt(process.env.BALANCE_PORT);
  return variable ? variable : 36581;
}

export function getDatabaseURL() {
  const variable = process.env.DATABASE_URL;
  return variable ? variable : 'postgres://localhost:5432';
}

export function getRedisURL() {
  const variable = process.env.REDIS_URL;
  return variable ? variable : 'redis://localhost:6379';
}

export function getBaseElo() {
  const variable = parseInt(process.env.BASE_ELO);
  return variable ? variable : 1200;
}

export function getMasterPort() {
  const variable = parseInt(process.env.MASTER_PORT);
  return variable ? variable : 28787;
}

export function getMasterHost() {
  const variable = process.env.MASTER_HOST;
  return variable ? variable : 'master.tomatenquark.org';
}
