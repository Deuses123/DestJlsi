export interface User {
    id: string
    name: string
}

export interface PeerCall {
    answer: (stream: MediaStream) => void
    on: (event: string, callback: (stream: MediaStream) => void) => void
}

export interface MockPeerInstance {
    on: (event: string, callback: any) => void
    call: (id: string, stream: MediaStream) => PeerCall
    destroy: () => void
}
