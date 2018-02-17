import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import { logError, ObjectNotFoundError } from '../util/util';
import { getClan } from '../api/v1/clan';

app.get('/clan/:name', (req, res) => {
	getClan(req.params.name)
		.then((result) => { res.render('clan', _.assign(result, { bannerURL: vars.bannerURL, _ })); })
		.catch(ObjectNotFoundError, () => { res.status(404).render('error', { status: 404, error: 'Clan not found.' }); })
		.catch((err) => {
			logError(err);
			res.status(500).render('error', { status: 500, error: err.message });
		});
});
