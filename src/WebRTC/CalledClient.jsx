import React, { useState } from 'react';

const CalledClient = () => {
    const [answer, setAnswer] = useState('');
    const peerConnection = new RTCPeerConnection();
    let dataChannel;
    let offer;
    dataChannel = peerConnection.createDataChannel('test');
    dataChannel.onopen = () => {
        console.log('Channel opened!');
    }
    dataChannel.onmessage = e => console.log('Message: ', e.data);
    peerConnection.onicecandidate = e => {
        console.log('icecandidate', JSON.stringify(peerConnection.localDescription));
    }
    const createOffer = async () => {
        offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
    }

    const setRemote = () => {
        peerConnection.setRemoteDescription(JSON.parse(answer));
    }


    return (
        <div>
            <input value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <button onClick={setRemote} >Send</button>
        </div>
    );
};

export default CalledClient;
