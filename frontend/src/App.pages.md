# Development notes for new pages

This file lists new developer pages. To add the WebRTC POC page to the app, add a route in App.jsx such as:

import WebrtcPoc from './pages/WebrtcPoc.jsx';

<Route path="/webrtc-poc" element={<WebrtcPoc />} />

Then open http://localhost:5173/webrtc-poc during local dev to test.
