import PeerConnection from "@/src/PeerConnection/PeerConnection";

export {}; // Ensures this file is treated as a module

declare global {
    var RTCPeerConnectionMock: RTCPeerConnection;
    var PeerConnection: PeerConnection;
}

global.RTCPeerConnection = global.PeerConnection = class {
    createDataChannel = jest.fn();
    createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
    createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
    setLocalDescription = jest.fn();
    setRemoteDescription = jest.fn();
    addIceCandidate = jest.fn();
    getSenders = jest.fn().mockReturnValue([]);
    getReceivers = jest.fn().mockReturnValue([]);

    oniceconnectionstatechange = jest.fn();
    onicecandidate = jest.fn();
    ondatachannel = jest.fn();
} as any;