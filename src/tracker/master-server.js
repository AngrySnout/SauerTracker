import net from 'net';
import _ from 'lodash';
import Promise from 'bluebird';

import config from '../../tracker.json';

/**
 *	Poll the master server.
 *	@param {function} resolve - Called with the new list. The list is an array of objects containing members 'host' and 'port'.
 *	@param {function} reject - Called with either an error message, or an array of errors, in case of an error.
 */
export default function getServerList_(resolve, reject) {
	let self = this;
	try {
		var agg = '';
		let socket = net.connect(config.master.port, config.master.name, function() {
				socket.write('list\n');
		});
		socket.on('data', function(data) {
			agg += data.toString();
		});
		socket.on('end', function() {
			if (agg !== '') {
				let res = [];
				_.each(agg.split('\n'), line => {
					let ts = line.split(' ');
					if (ts.length == 3 && ts[0] == 'addserver') res.push({host: ts[1], port: parseInt(ts[2])});
				});
				resolve(res);
			} else reject("Masterserver connection failed.");
		});
		socket.on('error', function(err) {
			reject(["Can't poll masterserver:", err]);
		});
	} catch(err) {
		reject(["Can't poll masterserver:", err]);
	}
}

export default function getServerList(resolve, reject) {
	resolve(JSON.parse('[{"host":"192.99.244.109","port":28785},{"host":"87.106.8.18","port":28785},{"host":"144.76.176.131","port":28785},{"host":"198.35.45.80","port":28785},{"host":"104.168.155.192","port":2010},{"host":"104.168.155.192","port":2020},{"host":"104.168.155.192","port":2030},{"host":"193.219.36.233","port":50014},{"host":"193.219.36.233","port":50016},{"host":"37.120.169.11","port":28785},{"host":"37.120.169.11","port":28795},{"host":"139.59.252.40","port":28785},{"host":"188.165.82.207","port":28785},{"host":"164.132.196.12","port":28785},{"host":"164.132.196.12","port":20000},{"host":"164.132.196.12","port":10040},{"host":"164.132.196.12","port":10000},{"host":"164.132.196.12","port":10050},{"host":"81.7.14.138","port":31000},{"host":"64.113.44.197","port":28785},{"host":"81.0.124.212","port":28785},{"host":"62.210.208.110","port":28785},{"host":"78.46.82.227","port":28785},{"host":"69.195.137.18","port":28789},{"host":"86.120.4.243","port":28785},{"host":"209.195.3.60","port":28785},{"host":"108.61.175.26","port":28785},{"host":"109.74.194.53","port":28785},{"host":"195.154.128.64","port":28785},{"host":"54.85.223.103","port":28785},{"host":"104.168.155.192","port":2000},{"host":"62.210.107.143","port":6969},{"host":"108.61.175.26","port":40000},{"host":"108.61.175.26","port":50000},{"host":"212.51.129.181","port":23000},{"host":"195.154.128.64","port":30000},{"host":"46.101.26.145","port":28785},{"host":"195.154.128.64","port":40000},{"host":"195.154.128.64","port":50000},{"host":"195.154.128.64","port":60000},{"host":"208.79.92.75","port":28785},{"host":"46.38.236.243","port":28785},{"host":"159.203.9.121","port":28785},{"host":"108.61.175.30","port":10000},{"host":"176.9.75.98","port":10070},{"host":"164.132.196.12","port":22222},{"host":"164.132.196.12","port":12345},{"host":"62.75.213.175","port":30000},{"host":"62.75.213.175","port":1337},{"host":"104.131.104.124","port":28785},{"host":"164.132.196.12","port":30000},{"host":"108.61.175.30","port":33330},{"host":"178.62.238.86","port":2048},{"host":"62.75.213.175","port":1234},{"host":"164.132.110.240","port":28785},{"host":"46.38.242.6","port":28785},{"host":"188.226.159.162","port":28785},{"host":"37.120.167.173","port":28790},{"host":"37.120.167.173","port":28785},{"host":"149.202.45.62","port":20000},{"host":"149.202.45.62","port":30000},{"host":"149.202.45.62","port":40000},{"host":"176.104.58.96","port":20000},{"host":"176.104.58.96","port":28785},{"host":"51.255.111.2","port":36000},{"host":"108.61.175.30","port":12123},{"host":"108.61.175.30","port":3000},{"host":"108.61.175.30","port":44444},{"host":"176.9.174.201","port":28785},{"host":"108.61.175.30","port":50000},{"host":"193.219.36.233","port":50010},{"host":"193.219.36.233","port":50012},{"host":"108.61.175.30","port":34343},{"host":"176.9.75.98","port":10080},{"host":"62.75.213.175","port":28785},{"host":"104.168.155.192","port":10},{"host":"149.202.45.62","port":10000},{"host":"188.166.192.40","port":12321},{"host":"73.225.6.24","port":28785},{"host":"69.195.137.18","port":28785},{"host":"185.139.1.19","port":28785},{"host":"185.139.1.19","port":28795},{"host":"51.255.111.2","port":20000},{"host":"81.7.14.138","port":30000},{"host":"178.62.238.86","port":1024},{"host":"185.139.1.19","port":10000},{"host":"188.166.192.40","port":1024},{"host":"188.166.192.40","port":6666},{"host":"158.69.210.219","port":28785},{"host":"78.47.108.27","port":28785},{"host":"82.211.61.56","port":28785},{"host":"68.45.138.139","port":34420},{"host":"172.246.118.59","port":30000},{"host":"5.189.130.203","port":28785},{"host":"31.192.151.29","port":28787},{"host":"31.192.151.29","port":28785},{"host":"96.40.163.34","port":28785},{"host":"172.245.99.11","port":20000},{"host":"172.246.118.59","port":28785},{"host":"108.61.175.30","port":28785},{"host":"108.61.175.30","port":33333},{"host":"96.40.163.34","port":10000},{"host":"148.251.42.164","port":28785},{"host":"84.200.63.11","port":28785},{"host":"89.163.251.234","port":28785},{"host":"96.40.163.34","port":19402},{"host":"82.51.91.140","port":28785},{"host":"173.64.87.122","port":28785},{"host":"216.26.112.58","port":28785},{"host":"95.236.177.137","port":54345},{"host":"45.55.4.37","port":12345},{"host":"45.55.4.37","port":54321},{"host":"45.55.4.37","port":31337},{"host":"45.55.4.37","port":22222},{"host":"94.222.57.181","port":10000},{"host":"41.136.23.10","port":12345},{"host":"41.136.23.10","port":31337},{"host":"188.165.234.17","port":28785},{"host":"80.145.235.21","port":28785},{"host":"45.55.4.37","port":55555},{"host":"51.255.211.169","port":28785},{"host":"77.58.210.241","port":28785},{"host":"75.65.203.6","port":28785}]'));
}
