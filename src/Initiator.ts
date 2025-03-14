import AbstractPeer from "@/src/abstracts/AbstractPeer";

class Initiator extends AbstractPeer {

    /**
     * The SDP answer generated by the receiver. This string is received from the remote peer.
     * @private
     * @type {string}
     */
    private answerString: string = ''; // Do not use "!answerString"
    private RTCAnswer: RTCSessionDescription | null = null; // Still in BETA

    /**
     * Some basic configuration for the data channel.
     * @private
     * @type {RTCDataChannelInit}
     */
    private RTCDataChannelInit: RTCDataChannelInit = { ordered: true };

    /**
     * @param RTCConfiguration RTCConfiguration
     */
    constructor(RTCConfiguration?: RTCConfiguration|object) {
        super(RTCConfiguration ?? {
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302'
                }
            ]
        });
    }

    /**
     * Initializes the initiator: sets up the data channel, creates an offer,
     * and waits for ICE candidates to be gathered.
     * @param label string
     * @param RTCOfferOptions RTCOfferOptions? | object
     * @param RTCDataChannelInit RTCDataChannelInit? | object
     * @returns {Promise<string>}
     */
    public async createDataChannelOffer(label: string, RTCDataChannelInit?: RTCDataChannelInit|object, RTCOfferOptions?: RTCOfferOptions|object,): Promise<string> {

        this.getPeerConnection().createDataChannel(label, RTCDataChannelInit ?? this.RTCDataChannelInit);

        // Generate an offer
        const offer = await this.getPeerConnection().createOffer(RTCOfferOptions);

        // The browser will start gathering ICE candidates in the background
        await this.getPeerConnection().setLocalDescription(offer);

        // Add the SDP Offer to the Offer string
        if (this.getPeerConnection().localDescription) {
            this.appendSignalingData({ type: 'sdp', sdp: this.getPeerConnection().localDescription! });
        }

        /**
         * Wait for ICE candidate gathering to complete, "getPeerConnection().onicecandidate" will
         * add ICE candidates to the SDP Offer when an ICE candidate is found
         */
        await this.waitForIceCandidates();

        return this.getOffer();
    }

    /**
     * Initializes the initiator: sets up the data channel, creates an offer,
     * and waits for ICE candidates to be gathered.
     * @param RTCOfferOptions RTCOfferOptions? | object
     * @returns {Promise<string>}
     */
    public async createTrackOffer(RTCOfferOptions?: RTCOfferOptions|object): Promise<string> {

        // Wait for the Offer to be created: ask a STUN server
        const offer = await this.getPeerConnection().createOffer(RTCOfferOptions);

        // The browser will start gathering ICE candidates in the background
        await this.getPeerConnection().setLocalDescription(offer);

        // Add the SDP Offer to the Offer string
        if (this.getPeerConnection().localDescription) {
            this.appendSignalingData({ type: 'sdp', sdp: this.getPeerConnection().localDescription! });
        }

        /**
         * Wait for ICE candidate gathering to complete, "getPeerConnection().onicecandidate" will
         * add ICE candidates to the SDP Offer when an ICE candidate is found
         */
        await this.waitForIceCandidates();

        return this.getOffer();
    }

    /**
     * Processes the Answer and establishes the connection.
     * The Answer is received from the remote peer.
     * @param answerString string
     * @returns {Promise<void>}
     */
    public async processAnswer(answerString: string): Promise<void> {

        this.answerString = answerString;

        return this.processSignalingData(answerString).then(async (results) => {
            for (const data of results) {
                if (data.type === 'sdp') {
                    await this.getPeerConnection().setRemoteDescription(new RTCSessionDescription(data.sdp));
                } else if (data.type === 'ice') {
                    await this.getPeerConnection().addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            }
        });
    }

    /**
     * Gets the generated offer.
     * @returns {string}
     */
    public getOffer(): string {
        return this.getSignalingString();
    }

    /**
     * Gets the received answer.
     * @returns {string}
     */
    public getAnswer(): string {
        return this.answerString;
    }

}

export default Initiator;