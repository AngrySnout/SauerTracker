import app from '../util/web';
import { ipNamesL } from '../admin/players';

app.get('/profile', (req, res) => {
  let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
  if (ip) ip = `${ip[1]}0`;
  else ip = '0.0.0.1';
  ipNamesL(ip, (names) => {
    res.render('profile', { ip, names });
  });
});

app.get('/api/profile', (req, res) => {
  let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
  if (ip) ip = `${ip[1]}0`;
  else ip = '0.0.0.1';
  ipNamesL(ip, (names) => {
    res.send({ ip, names });
  });
});
