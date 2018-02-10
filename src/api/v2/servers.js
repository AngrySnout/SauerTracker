import app from '../../util/web';
import { getServerList } from '../v1/servers';

app.get('/api/v2/servers', (req, res) => {
  getServerList()
    .then((list) => { res.send(list); })
    .catch((err) => { res.status(500).send({ error: err }); });
});
