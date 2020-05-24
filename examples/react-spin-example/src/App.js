import React, {Component} from 'react';

const JaxcoreAPI = require('jaxcore-api');

const red = [255, 0, 0];
const blue = [255, 0, 0];
const yellow = [255, 255, 0];
const cyan = [0, 0, 255];

class MyCustomAdapter extends JaxcoreAPI.Adapter {
	constructor() {
		super(...arguments);
		
		const {spin} = this.devices;
		spin.rainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				// Receive a "spin" event for every increment of the rotary encoder (32 per rotation)
				// - diff is an integer value, -1, or +1
				// - spinTime is the time in milliseconds since the last spin event
				// Use diff and spinTime together to analyze rotation speed or acceleration
				// When spinning quickly the `diff` value can increase up to -10 or +10 or sometimes higher
				// The minimum `spinTime` is around 60ms, the bluetooth rate limit
				
				console.log('spin', diff, spinTime);
				spin.rotate(diff, red, blue);
			},
			
			knob: function (pushed) {
				// Receive a "knob" event when the Jaxcore Spin knob is pushed or released
				
				if (pushed) {
					console.log('knob pushed');
					spin.flash(yellow);
				}
				else {
					console.log('knob released');
				}
			},
			
			button: function (pushed) {
				// Receive a "button" event when the Jaxcore Spin secondary button is pushed or released
				
				if (pushed) {
					console.log('button pushed');
					spin.flash(cyan);
				}
				else {
					console.log('button released');
				}
			}
		});
	}
}

class App extends Component {
	constructor() {
		super();
		this.state = {
			spins: {}
		};
		this.spins = {};
	}
	
	componentDidMount() {
		JaxcoreAPI.connect()
		.then(api => {
			// a new instance of MyCustomAdapter will be created
			// each time a Jaxcore Spin connects to the Websocket Server
			// the adapter will be destroyed when the Spin disconnects
			// api.connectSpinAdapter(MyCustomAdapter);
			
			api.jaxcore.on('device-connected', (type, device) =>{
				if (type === 'websocketSpin') {
					this.spinConnected(device);
					
				}
			});
			
		})
		.catch(e => {
			console.log(e);
			debugger;
		});
		
	}
	
	spinConnected(device) {
		const spins = {
			...this.state.spins
		};
		spins[device.id] = device.state;
		this.setState({
			spins
		});
		
		// synchronize spin updates to React state
		device.on('update', (updates) => {
			console.log('spin update', updates);
			const spins = {
				...this.state.spins
			};
			
			for (let id in updates) {
				spins[device.id][id] = updates[id];
			}
			
			this.setState({
				spins
			});
		})
	}
	
	render() {
		return (
			<div className="App">
				<pre>
					{JSON.stringify(this.state.spins, null, 4)}
				</pre>
			</div>
		);
	}
}

export default App;
