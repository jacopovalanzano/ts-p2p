import PeerConnection from "@/src/PeerConnection/PeerConnection";

abstract class AbstractPeer {

    /**
     * Contains SDP offer or answer and ICE candidates
     * @private
     * @type {string}
     */
    private signalingString: string = '';

    /**
     * @private
     * @type {PeerConnection}
     */
    private RTCPeerConnection: PeerConnection;

    /**
     * The first thing we must do, is to create the peer connection
     * @param RTCConfiguration RTCConfiguration
     */
    protected constructor(RTCConfiguration: RTCConfiguration) {
        this.RTCPeerConnection = ( new PeerConnection( RTCConfiguration ) );

        // Set up event handlers: when an ICE candidate is found, add it to the SDP signaling string
        this.RTCPeerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                this.appendSignalingData({ type: 'ice', candidate: event.candidate });
            }
        };
    }

    /**
     * Returns the offer string
     * @returns {string}
     */
    abstract getOffer(): string

    /**
     * Returns the answer string
     * @returns {string}
     */
    abstract getAnswer(): string

    /**
     * Sends data through the data channel.
     * @param label
     * @param data
     */
    public send(label: string, data: string) {
        this.getPeerConnection().getDataChannel(label).send(data);
    }

    /**
     * Adds a track to the peer connection
     * @param track MediaStreamTrack
     * @param streams MediaStream
     * @returns {RTCRtpSender}
     */
    public addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
        return this.getPeerConnection().addTrack(track, ...streams);
    }

    /**
     * Returns the signaling string.
     * @returns {string}
     */
    public getSignalingString(): string {
        return this.signalingString;
    }

    /**
     * Returns the peer connection
     * @returns {PeerConnection}
     */
    public getPeerConnection(): PeerConnection {
        return this.RTCPeerConnection;
    }

    /**
     * Close the data channel first, then the peer connection
     * @returns {void}
     */
    public closePeerConnection(): void {
        const peerConnection = this.getPeerConnection();
        if (peerConnection) {
            // Remove peer connection event listeners
            peerConnection.onicecandidate = null;
            peerConnection.onconnectionstatechange = null;
            peerConnection.ontrack = null;
            peerConnection.ondatachannel = null;

            // Cleanup data channels
            for (const label in peerConnection.getDataChannels()) {
                const dataChannel = peerConnection.getDataChannels()[label];
                dataChannel.onopen = null;
                dataChannel.onmessage = null;
                dataChannel.onclose = null;
                dataChannel.onerror = null;
                dataChannel.onclosing = null;
                dataChannel.onbufferedamountlow = null;
                dataChannel.close();
            }

            // Stop all tracks (both senders and receivers)
            const senders = peerConnection.getSenders() ?? [];
            senders.forEach((sender) => {
                sender.track?.stop(); // Stop each track (audio/video)
            });

            const receivers = peerConnection.getReceivers() ?? [];
            receivers.forEach((receiver) => {
                receiver.track?.stop(); // Stop each track (audio/video)
            });

            // Close and clean up the peer connection
            peerConnection.close();
        }
    }

    /**
     * Waits for ICE candidate gathering to complete.
     * @protected
     * @returns {Promise<void>}
     */
    protected waitForIceCandidates(): Promise<void> {
        return new Promise((resolve) => {
            if (this.getPeerConnection().iceGatheringState === "complete") {
                resolve();
            } else {
                this.getPeerConnection().onicegatheringstatechange = () => {
                    if (this.getPeerConnection().iceGatheringState === "complete") {
                        resolve();
                    }
                };
            }
        });
    }

    /**
     * Appends signaling data to the signaling value.
     * @protected
     * @param data {type: string, candidate?: RTCIceCandidateInit, sdp?: RTCSessionDescription | null}
     * @returns {void}
     */
    protected appendSignalingData(data: { type: string, candidate?: RTCIceCandidateInit, sdp?: RTCSessionDescription|null }): void {
        this.signalingString += JSON.stringify(data) + '\n';
    }

    /**
     * Processes the signaling data and returns an array of parsed objects.
     * @protected
     * @param signalingString string
     * @returns {Promise<any[]>}
     */
    protected processSignalingData(signalingString: string): Promise<any[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const lines = signalingString.split('\n').filter(line => line.trim());
                const results: any[] = [];

                for (const line of lines) {
                    const data = JSON.parse(line);
                    results.push(data);
                }

                resolve(results); // Resolve with an array of parsed objects
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generates an RTCSessionDescription from a string.
     * @private
     * @param offerOrAnswerSring string
     * @returns {RTCSessionDescription}
     */
    private createRTCDescriptionFromString(offerOrAnswerSring: string): RTCSessionDescription {
        return new RTCSessionDescription(JSON.parse(offerOrAnswerSring));
    }
}

export default AbstractPeer;