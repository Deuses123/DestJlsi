import React, { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

function CalledClient() {
    let peer = new Peer();
    const [callState, setCallState] = useState(false);
    const [otherID, setOtherID] = useState('');
    const [peerCall, setPeerCall] = useState(null); // Добавляем состояние для peerCall
    const myRef = useRef(null);
    const remoteRef = useRef(null);
    const [peerToken, setPeerToken] = useState('');
    useEffect(() => {
        peer.on('open', function(peerID) {
            console.log(peerID)
            setPeerToken(peerID);
        });
        peer.on('call', function(call) {
            setPeerCall(call);
            setCallState(true);
        });
    }, []);

    function callanswer() {
        if (peerCall) {
            navigator.mediaDevices.getDisplayMedia({ audio: true, video: true }).then(function(mediaStream) {
                peerCall.answer(mediaStream, true, true);
                myRef.current.srcObject = mediaStream;
                setTimeout(function() {
                    remoteRef.current.srcObject = peerCall.remoteStream;
                }, 1500);
            }).catch(function(err) {
                console.log(err.name + ": " + err.message);
            });
        }
    }




    function callToNode() {
        navigator.mediaDevices.getDisplayMedia({video: true }).then(function(mediaStream) {
            let call = peer.call(otherID, mediaStream);
            call.on('stream', function(stream) {
                setTimeout(function() {
                    remoteRef.current.srcObject = call.remoteStream;
                }, 1500);
            });
            myRef.current.srcObject = mediaStream;
        }).catch(function(err) {
            console.log(err.name + ": " + err.message);
        });
    }


    return (
        <div>
            <input value={otherID} onChange={e => setOtherID(e.target.value)} />
            <button onClick={callToNode}>Вызов</button>

            <br/>
            <video ref={myRef} autoPlay muted></video>
            <div>
                {
                    callState ? <button onClick={callanswer}>Принять</button> : <br/>
                }
            </div>
            <video ref={remoteRef} autoPlay/>


        </div>
    );
}

export default CalledClient;