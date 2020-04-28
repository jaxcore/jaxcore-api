const Jaxcore = require('jaxcore');
const WebSocketPlugin = require('jaxcore-websocket-plugin/websocket-client');

function connect(options) {
	if (!options) options = {};
    return new Promise(function (resolve, reject) {
		const jaxcore = new Jaxcore();
		jaxcore.addPlugin(WebSocketPlugin);

		let connected = false;
		let failed = false;

		function connectSpinAdapter(customSpinAdapterClass, onAdapterCreated, onAdapterDestroyed) {

			jaxcore.addAdapter('custom-spin-adapter', customSpinAdapterClass);

			jaxcore.defineAdapter('CustomSpinAdapterClass', {
				adapterType: 'custom-spin-adapter',
				deviceType: 'spin'
			});

			jaxcore.on('device-connected', function (type, device) {
				if (type === 'websocketSpin') {
					const spin = device;

					console.log('connected', spin);

					jaxcore.connectAdapter(spin, 'CustomSpinAdapterClass', function (err, adapter) {
						if (err) {
							console.log('adapter error', e);
						} else {
							console.log('adapter created', adapter);
							onAdapterCreated(adapter);
						}
					});
				} else {
					//console.log('device-connected', type);
				}
			});
		}

		function connectSocket(options) {
			jaxcore.connectWebsocket(options, function (err, websocketClient) {
				if (err) {
					if (options.onError) {
						options.onError(err);
					}

					if (!connected && !failed) {
						failed = true;
						reject(err);
					}

					if (options.onConnect) {
						options.onConnect();
					}
				} else if (websocketClient) {
					if (!connected && !failed) {
						connected = true;
						resolve(jaxcore, connectSpinAdapter);
					}
				}
			});
		}

		jaxcore.on('service-disconnected', (type, device) => {
			if (type === 'websocketClient') {
				console.log('websocket service-disconnected', type, device.id);
				if (options.onDisconnect) {
					let reconnect = options.onDisconnect(device);
					if (reconnect) {
						connectSocket();
					}
				} else {
					connectSocket();
				}
			}
		});

		jaxcore.on('service-connected', (type, device) => {
			console.log('service-connected', type, device.id);
			if (options.onConnect) {
				options.onConnect(device);
			}
		});

		let o = {
			protocol: options.protocol || 'http',
			host: options.host || 'localhost',
			port: options.port || 37500,
			options: {
				reconnection: true
			}
		};

		connectSocket(o);
	});
}

module.exports = {
    connect
    // connectExtension?
};