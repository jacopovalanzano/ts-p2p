class PeerConnection extends RTCPeerConnection {

    /**
     * The list of labels
     * A label is a string that is used to identify the data channel.
     * @private
     * @type {string[]}
     */
    public labels: string[] = [];

    /**
     * @private
     * @type {Record<string, RTCDataChannel>}
     */
    public RTCDataChannels: Record<string, RTCDataChannel> = {};

    /**
     * The data channel initialization options list.
     * @private
     * @type {Record<string, RTCDataChannelInit>}
     */
    public RTCDataChannelInits: Record<string, RTCDataChannelInit> = {};

    /**
     * @protected
     * @param RTCConfiguration RTCConfiguration
     */
    constructor(RTCConfiguration?: RTCConfiguration) {
        super(RTCConfiguration);
    }

    /**
     * Return the list of labels
     * @returns {string[]}
     */
    public getLabels(): string[] {
        return this.labels;
    }

    /**
     * Return the data channel reference
     * @param label string
     * @returns {RTCDataChannel}
     */
    public getDataChannel(label: string): RTCDataChannel {
        return this.RTCDataChannels[label];
    }

    /**
     * Returns all RTCDataChannels as a Record.
     * @returns {Record<string, RTCDataChannel>}
     */
    public getDataChannels(): Record<string, RTCDataChannel> {
        return this.RTCDataChannels;
    }

    /**
     * Allow to set the data channel
     * @param RTCDataChannel RTCDataChannel
     * @returns {void}
     */
    public setDataChannel(RTCDataChannel: RTCDataChannel): void {
        this.RTCDataChannels[RTCDataChannel.label] = RTCDataChannel;
        this.RTCDataChannelInits[RTCDataChannel.label] = {
            ordered: RTCDataChannel.ordered,
            maxPacketLifeTime: RTCDataChannel.maxPacketLifeTime ?? undefined,
            maxRetransmits: RTCDataChannel.maxRetransmits ?? undefined,
            protocol: RTCDataChannel.protocol,
            negotiated: RTCDataChannel.negotiated,
            id: RTCDataChannel.id !== null ? RTCDataChannel.id : undefined // The id is set internally and may not be available until the channel is open
        };
    }

    /**
     * Save a local reference to the data channel
     * @param label sting
     * @param RTCDataChannelInit RTCDataChannelInit
     * @returns {RTCDataChannel}
     */
    public createDataChannel(label: string, RTCDataChannelInit?: RTCDataChannelInit): RTCDataChannel {
        this.labels.push(label);
        const RTCDataChannel = super.createDataChannel(label, RTCDataChannelInit);
        this.RTCDataChannels[label] = RTCDataChannel;
        return RTCDataChannel;
    }

    /**
     * @param RTCDataChannel RTCDataChannel
     * @returns {RTCDataChannel}
     */
    public addDataChannel(RTCDataChannel: RTCDataChannel): RTCDataChannel {
        this.labels.push(RTCDataChannel.label);
        this.RTCDataChannels[RTCDataChannel.label] = RTCDataChannel;
        return RTCDataChannel;
    }

    /**
     * Return the data channel initialization options
     * @param label string
     * @returns {RTCDataChannelInit}
     */
    public getDataChannelInit(label: string): RTCDataChannelInit {
        return this.RTCDataChannelInits[label]
    }

    /**
     * @inheritDoc
     */
    public addIceCandidate(candidate?: RTCIceCandidateInit): Promise<void> {
        return super.addIceCandidate(candidate);
    }

    /**
     * @inheritDoc
     */
    public addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
        return super.addTrack(track, ...streams);
    }

    /**
     * @inheritDoc
     */
    public getSenders(): RTCRtpSender[] {
        return super.getSenders();
    }

    /**
     * @inheritDoc
     */
    public addTransceiver(trackOrKind: MediaStreamTrack | string, init?: RTCRtpTransceiverInit): RTCRtpTransceiver {
        return super.addTransceiver(trackOrKind, init);
    }

    /**
     * @inheritDoc
     */
    public getReceivers(): RTCRtpReceiver[] {
        return super.getReceivers();
    }

    /**
     * @inheritDoc
     */
    public getTransceivers(): RTCRtpTransceiver[] {
        return super.getTransceivers();
    }

    /**
     * @inheritDoc
     */
    public setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
        return super.setRemoteDescription(description);
    }

    /**
     * @inheritDoc
     */
    public setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
        return super.setLocalDescription(description);
    }

    /**
     * @inheritDoc
     */
    public createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    public createOffer(successCallback: RTCSessionDescriptionCallback, failureCallback: RTCPeerConnectionErrorCallback, options?: RTCOfferOptions): Promise<void>;
    public createOffer(...args: any[]): Promise<RTCSessionDescriptionInit | void> {
        if (args.length === 3) {
            // If two callbacks are provided, call the original method with callbacks
            return super.createOffer(args[0], args[1], args[2]);
        } else {
            // If only options are provided, call the original method with options
            return super.createOffer(args[0]);
        }
    }

    /**
     * @inheritDoc
     */
    public createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    public createAnswer(successCallback: RTCSessionDescriptionCallback, failureCallback: RTCPeerConnectionErrorCallback): Promise<void>;
    public createAnswer(...args: any[]): Promise<RTCSessionDescriptionInit | void> {
        if (args.length === 2) {
            // If successCallback and failureCallback are provided, call the base method with the callbacks
            return super.createAnswer(args[0], args[1]);
        } else {
            // If only options are provided, call the base method with the options
            return super.createAnswer(args[0]);
        }
    }

    /**
     * @inheritDoc
     */
    public close() {
        super.close();
        this.labels = [];
        this.RTCDataChannels = {};
        this.RTCDataChannelInits = {};
    }
}

export default PeerConnection;