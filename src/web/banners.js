import app from '../util/web';
import vars from '../../vars.json';
import bannersTemplate from '../../website/views/banners.pug';

app.get('/banners', (req, res) => {
  res.send(bannersTemplate({ query: req.query, bannerURL: vars.bannerURL }));
});
