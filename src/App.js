import './App.css';
import {useState} from 'react';
import CalledClient from "./WebRTC/CalledClient";
import WebRTCExample from "./WebRTC/WebRTCExample";

function App() {
    const [state, setState] = useState(0);
    return (
        <div>
            <button onClick={() => setState(1)}>Камера</button>
            <button onClick={() => setState(2)}>Screen</button>
            {
                state === 1 ? <WebRTCExample/> : ''
            }
            {
                state === 2 ? <CalledClient/> : ''
            }
        </div>
    );
}

export default App;
