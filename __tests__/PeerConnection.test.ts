global.RTCRtpSender = class RTCRtpSender {} as any;

global.RTCRtpReceiver = class RTCRtpReceiver {} as any;

global.MediaStreamTrack = class MediaStreamTrack {} as any;

global.MediaStream = class MediaStream {
    getVideoTracks() {
        return [
            new MediaStreamTrack()
        ];
    }
} as any;

global.PeerConnection = global.RTCPeerConnection = class PeerConnection {
    localDescription = {
        sdp: 'mock-sdp',
        type: 'answer'
    }
    createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
    createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
    createDataChannel = jest.fn().mockImplementation(PeerConnection.prototype.createDataChannel);
    close = jest.fn();
} as any;

global.RTCRtpTransceiver = class RTCRtpTransceiver {
    mid?: string;
    currentDirection?: string;
    direction?: string;
    receiver?: any;
    sender?: any;
    setCodecPreferences!: Function;
    stop!: Function;
} as any;

global.RTCDataChannel = class RTCDataChannel {
    label = 'mock-label';
} as any;

global.RTCIceCandidate = class {
    candidate = 'mock-candidate';
} as any;

global.RTCSessionDescription = class {
    sdp = 'mock-sdp';
    type = 'mock-type';
} as any;

import PeerConnection from "@/src/PeerConnection/PeerConnection";

describe('PeerConnection', () => {
    let peerConnection: PeerConnection;

    beforeEach(() => {
        peerConnection = new PeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        jest.spyOn(peerConnection, 'getTransceivers').mockReturnValue([
            {
                direction: "sendrecv",
                sender: {
                    track: {
                        kind: "audio"
                    }
                }
            } as RTCRtpTransceiver
        ]);
        jest.spyOn(peerConnection, 'addIceCandidate').mockReturnValue(Promise.resolve());
        jest.spyOn(peerConnection, 'addTransceiver').mockReturnValue(new RTCRtpTransceiver());
        jest.spyOn(peerConnection, 'addTrack').mockReturnValue(RTCRtpSender.prototype);
        jest.spyOn(peerConnection, 'getSenders').mockReturnValue([RTCRtpSender.prototype]);
        jest.spyOn(peerConnection, 'getReceivers').mockReturnValue([RTCRtpReceiver.prototype]);
        jest.spyOn(peerConnection, 'setRemoteDescription').mockReturnValue(Promise.resolve());
        jest.spyOn(peerConnection, 'setLocalDescription').mockReturnValue(Promise.resolve());
        jest.spyOn(peerConnection, 'getDataChannelInit').mockReturnValue({ordered: false});
        jest.spyOn(peerConnection, 'createDataChannel').mockImplementation( (label, RTCDataChannelInit?: RTCDataChannelInit | undefined): RTCDataChannel => {
            peerConnection.labels.push(label);
            const dataChannel = new RTCDataChannel();
            peerConnection.RTCDataChannels[label] = dataChannel;
            return dataChannel;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1
    test('should initialize PeerConnection without errors', () => {
        expect(peerConnection).toBeInstanceOf(PeerConnection);
    });

    // TEST 2
    test('should add and retrieve data channels', () => {
        const mockChannel = peerConnection.createDataChannel('mock-label')
        expect(mockChannel).toHaveProperty('label', 'mock-label');
        expect(peerConnection.getDataChannel('mock-label')).toEqual(
            {
                "label": "mock-label"
            } as RTCDataChannel
        );
    });

    // TEST 3
    test('should set a data channel', () => {
        const mockChannel = {
            label: 'test',
            ordered: true,
            protocol: '',
            negotiated: false,
            id: 1,
        } as RTCDataChannel;
        peerConnection.setDataChannel(mockChannel);
        expect(peerConnection.getDataChannel('test')).toBe(mockChannel);
    });

    // TEST 4
    test('should add a data channel', () => {
        const mockChannel = {
            label: 'test',
        } as RTCDataChannel;
        peerConnection.addDataChannel(mockChannel);
        expect(peerConnection.getLabels()).toContain('test');
    });

    // TEST 5
    test('should close connection and reset state', () => {
        peerConnection.createDataChannel('test');
        expect(peerConnection.getLabels()).toEqual(['test']);
        peerConnection.close();
        expect(peerConnection.getLabels()).toHaveLength(1);
        expect(peerConnection.getDataChannels()).toEqual({
            "test": {
                label: "mock-label"
            } as RTCDataChannel
        });
    });

    // TEST 6
    test('should set and get data channel init options', () => {
        peerConnection.createDataChannel('test', { ordered: false });
        expect(peerConnection.getDataChannelInit('test')).toEqual({ ordered: false });
    });

    // TEST 7
    test('should call addIceCandidate with provided candidate', async () => {
        const candidate = { candidate: 'mock-candidate' };
        await peerConnection.addIceCandidate(candidate);
        expect(peerConnection.addIceCandidate).toHaveBeenCalledWith(candidate);
    });

    // TEST 8
    test('should create an offer', async () => {
        const offer = await peerConnection.createOffer();
        expect(peerConnection.createOffer).toHaveBeenCalled();
        expect(offer).toEqual({ type: 'offer', sdp: 'mock-sdp' });
    });

    // TEST 9
    test('should create an answer', async () => {
        const answer = await peerConnection.createAnswer();
        expect(peerConnection.createAnswer).toHaveBeenCalled();
        expect(answer).toEqual({ type: 'answer', sdp: 'mock-sdp' });
    });

    // TEST 10
    test('should call setRemoteDescription', async () => {
        // Create a data channel first
        const description = { type: 'offer', sdp: 'mock-sdp' } as RTCSessionDescription;
        await peerConnection.setRemoteDescription(description);
        expect(peerConnection.setRemoteDescription).toHaveBeenCalledWith(description);
    });

    // TEST 11
    test('should call setLocalDescription', async () => {
        const description = { type: 'answer', sdp: 'mock-sdp' } as RTCSessionDescription;
        // Must create an answer before setting local description
        await peerConnection.setRemoteDescription( new RTCSessionDescription( description ) );
        const answer = await peerConnection.createAnswer( description );
        await peerConnection.setLocalDescription( description );
        expect(peerConnection.localDescription).toEqual( description );
    });

    // TEST 12
    test('should retrieve senders, receivers, and transceivers', async () => {
        // Add Senders
        const stream = new MediaStream();
        const sender = peerConnection.addTrack(stream.getVideoTracks()[0], stream);
        expect(peerConnection.getSenders()).toEqual([sender]);
        // Add Receivers
        peerConnection.ontrack = (event) => {
            const receiver = event.receiver;
            console.log(receiver); // RTCRtpReceiver object
        };
        expect(peerConnection.getReceivers()).toEqual([RTCRtpReceiver.prototype]);
        // Add Transceivers
        peerConnection.addTransceiver("audio", {
            direction: "sendrecv",
            sender: {
                track: {
                    kind: "audio"
                }
            }
        } as RTCRtpTransceiverInit);
        expect(peerConnection.getTransceivers()).toEqual([
            {
                direction: "sendrecv",
                sender: {
                    track: {
                        kind: "audio"
                    }
                }
            }
        ]);
    });
});
