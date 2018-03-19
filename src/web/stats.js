import _ from 'lodash';
import moment from 'moment';

import app from '../util/web';
import database from '../util/database';

app.get('/stats', (req, res) => {
	const weekAgo = moment().endOf('day').subtract(7, 'days').format('YYYY-MM-DD');
	database.raw(`SELECT to_char(timestamp, 'MM-DD') AS date, COUNT(*) AS games FROM games WHERE timestamp > '${weekAgo}' GROUP BY date ORDER BY date DESC`)
		.then(result => result.rows)
		.then((days) => {
			const stats = _.orderBy(days, 'date', 'desc');
			res.render('stats', { stats, today: moment().format('MM-DD'), yesterday: moment().subtract(1, 'days').format('MM-DD') });
		});
});
