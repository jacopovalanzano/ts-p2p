global.RTCSessionDescription = class {
    sdp = 'mock-sdp';
    type = 'mock-type';
} as any;

import Initiator from "@/src/Initiator";  // Adjust the import path according to your setup
jest.mock("@/src/abstracts/AbstractPeer", () => {
    return jest.fn().mockImplementation(() => {
        return {
            createDataChannelOffer: Initiator.prototype.createDataChannelOffer,
            createTrackOffer: Initiator.prototype.createTrackOffer,
            getOffer: Initiator.prototype.getOffer,
            getAnswer: Initiator.prototype.getAnswer,
            processAnswer: Initiator.prototype.processAnswer,
            getPeerConnection: jest.fn().mockReturnValue({
                createDataChannel: jest.fn(),
                createOffer: jest.fn().mockResolvedValue({ type: "offer", sdp: "mock-sdp" }),
                setLocalDescription: jest.fn(),
                setRemoteDescription: jest.fn(),
                localDescription: { type: "offer", sdp: "mock-sdp" },
                addIceCandidate: jest.fn(),
                onicecandidate: jest.fn(),
            }),
            appendSignalingData: jest.fn(),
            waitForIceCandidates: jest.fn().mockResolvedValue(undefined),
            getSignalingString: jest.fn().mockReturnValue("mock-sdp"),
            processSignalingData: jest.fn().mockResolvedValue([{ type: "sdp", sdp: "mock-sdp" }]),
        };
    });
});

describe("Initiator", () => {
    let initiator: Initiator;

    beforeEach(() => {
        initiator = new Initiator({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1
    it("should create a data channel offer", async () => {
        const label = "data-channel-1";
        const offer = await initiator.createDataChannelOffer(label, { ordered: false }, { iceRestart: false });
        expect(initiator.getPeerConnection().createDataChannel).toHaveBeenCalledWith(label, { ordered: false });
        expect(initiator.getPeerConnection().createOffer).toHaveBeenCalledWith({ iceRestart: false });
        expect(offer).toBe("mock-sdp");
    });

    // TEST 2
    it("should create a track offer", async () => {
        const offer = await initiator.createTrackOffer({ iceRestart: false });
        expect(initiator.getPeerConnection().createOffer).toHaveBeenCalledWith({ iceRestart: false });
        expect(offer).toBe("mock-sdp");
    });

    // TEST 3
    it("should process the answer and set remote description", async () => {
        const answerString = "mock-answer";
        await initiator.processAnswer(answerString);
        expect(initiator.getPeerConnection().setRemoteDescription).toHaveBeenCalledWith(
            new RTCSessionDescription({ type: "offer", sdp: "mock-sdp" })
        );
        const answer = initiator.getAnswer();
        expect(answer).toBe("mock-answer");
    });

    // TEST 4
    it("should return the correct offer string", () => {
        const offer = initiator.getOffer();
        expect(offer).toBe("mock-sdp");
    });

    // TEST 5
    it("should return the correct answer string", () => {
        const answer = initiator.getAnswer();
        expect(answer).toBe("");
    });
});
