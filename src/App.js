import './App.css';
import {useState} from 'react';
import CalledClient from "./WebRTC/CalledClient";
import CallingClient from "./WebRTC/WebRTCExample";
import WebRTCExample from "./WebRTC/WebRTCExample";

function App() {

    return (
        <div>
            <WebRTCExample/>
        </div>
    );
}

export default App;
