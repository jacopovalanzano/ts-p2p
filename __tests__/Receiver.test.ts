global.RTCDataChannel = class {
    onmessage = jest.fn();
} as any;

global.RTCIceCandidate = class {
    candidate = 'mock-candidate';
} as any;

global.RTCSessionDescription = class {
    sdp = 'mock-sdp';
    type = 'mock-type';
} as any;

import Receiver from "@/src/Receiver";
import PeerConnection from "@/src/PeerConnection/PeerConnection";

describe('Receiver', () => {

    let receiver: Receiver;
    let mockPeerConnection: PeerConnection;
    let mockDataChannel: RTCDataChannel;

    beforeEach(() => {
        // Initialize mock instances
        mockPeerConnection = new PeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        mockDataChannel = new RTCDataChannel();

        // Create a Receiver instance with a mock RTCConfiguration
        receiver = new Receiver({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Mock getPeerConnection to return our mock PeerConnection
        jest.spyOn(receiver, 'getPeerConnection').mockReturnValue(mockPeerConnection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1
    it('should initialize with the provided RTCConfiguration', () => {
        expect(receiver).toBeDefined();
    });

    // TEST 2
    it('should set the remote description when processing an offer', async () => {
        const offerString = '{"type":"sdp","sdp":"some-sdp-offer"}';
        // Mock the setRemoteDescription method
        const setRemoteDescriptionMock = jest.fn();
        mockPeerConnection.setRemoteDescription = setRemoteDescriptionMock;
        // Run the processOffer method
        await receiver.processOffer(offerString);
        // Check that the remote description was set
        expect(setRemoteDescriptionMock).toHaveBeenCalledWith(new RTCSessionDescription({ type: 'offer', sdp: 'some-sdp-offer' }));
    });

    // TEST3
    it('should create and set the local description after processing the offer', async () => {
        const offerString = '{"type":"sdp","sdp":"some-sdp-offer"}';
        const createAnswerMock = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'some-sdp-answer' });
        mockPeerConnection.createAnswer = createAnswerMock;
        const setLocalDescriptionMock = jest.fn();
        mockPeerConnection.setLocalDescription = setLocalDescriptionMock;
        // Process the offer
        await receiver.processOffer(offerString);
        // Check if the answer was created and set
        expect(createAnswerMock).toHaveBeenCalled();
        expect(setLocalDescriptionMock).toHaveBeenCalledWith({ type: 'answer', sdp: 'some-sdp-answer' });
    });

    // TEST 4
    it('should add ICE candidates when processing an offer with ice candidates', async () => {
        const offerString = '{"type":"ice","candidate":{"candidate":"some-ice-candidate"}}';
        const addIceCandidateMock = jest.fn();
        mockPeerConnection.addIceCandidate = addIceCandidateMock;
        // Process the ICE candidate
        await receiver.processOffer(offerString);
        // Check that the ICE candidate was added
        expect(addIceCandidateMock).toHaveBeenCalledWith(new RTCIceCandidate({ candidate: 'some-ice-candidate' }));
    });

    // TEST 5
    it('should return the correct offer string', () => {
        receiver['offerString'] = '{"type":"sdp","sdp":"some-offer"}';
        expect(receiver.getOffer()).toBe('{"type":"sdp","sdp":"some-offer"}');
    });

    // TEST 6
    it('should return the correct answer string', () => {
        receiver['signalingString'] = '{"type":"sdp","sdp":"some-answer"}';
        expect(receiver.getAnswer()).toBe('{"type":"sdp","sdp":"some-answer"}');
    });

});
