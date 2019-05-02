import EventEmitter from "eventemitter3";

export default class MultiChannel extends EventEmitter {
	constructor(channel1) {
		super();

		this.channel1 = channel1;
		this.channel2 = null;
		this.selectedChannel = null;

		this._handleConnection = this._handleConnection.bind(this);
		this._handleDisconnection = this._handleDisconnection.bind(this);
		this._handleData = this._handleData.bind(this);

		this._subscribeChannel(this.channel1, () => this.channel2);
	}

	send(data) {
		this._checkConnected();

		this.selectedChannel.send(data);
	}

	disconnect() {
		this.channel1.disconnect();
		if (this.channel2) this.channel2.disconnect();
		this._clean();
	}

	connect(channel2) {
		this.channel2 = channel2;
		this._subscribeChannel(this.channel2, () => this.channel1);
	}

	on(event, handler) {
		if (event === "connected" && this.isConnected) handler();
		return super.on(event, handler);
	}

	get token() {
		return this.channel1.token;
	}

	get isConnected() {
		return this.selectedChannel !== null;
	}

	_checkConnected() {
		if (!this.isConnected) throw new Error("Error: Not connected");
	}

	_subscribeChannel(channel, getOtherChannel) {
		channel
			.on("connected", () => {
				this._handleConnection(channel);
			})
			.on("disconnected", () => {
				this._handleDisconnection(channel, getOtherChannel());
			})
			.on("data", this._handleData);
	}

	_handleConnection(channel) {
		if (this.isConnected) return;
		this.selectedChannel = channel;
		this.emit("connected");
	}

	_handleDisconnection(channel, otherChannel) {
		const wasConnected = this.isConnected;

		if (otherChannel && otherChannel.isConnected)
			this.selectedChannel = otherChannel;
		else if (wasConnected) {
			this._clean();
			this.emit("disconnected");
		}
	}

	_handleData(data) {
		this.emit("data", data);
	}

	_clean() {
		this.selectedChannel = null;
		this.$waitChannel2 = null;
	}
}
