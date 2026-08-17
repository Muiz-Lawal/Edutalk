import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import 'C:/Users/abdul/Desktop/class/frontend/src/styles/VideoRoom.css';

export default function VideoRoom({ roomId, sessionId, classId, onSessionEnd }) {
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({});
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection, ... }
  const iceCandidateQueueRef = useRef({}); // { socketId: [RTCIceCandidate, ...], ... }
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);

  useEffect(() => {
    initializeVideoRoom();
    return () => cleanupVideoRoom();
  }, [roomId]);

  // Initialize video room: connect socket, get stream, join room
  const initializeVideoRoom = async () => {
    try {
      // Get video room token
      const tokenResponse = await api.get(`/video/rooms/${roomId}/token`);
      const { token } = tokenResponse.data;

      // Start local media stream FIRST
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize Socket.io connection
      const authToken = localStorage.getItem('token');
      socketRef.current = io('http://localhost:5000', {
        auth: { token: authToken },
      });

      socketRef.current.on('connect', () => {
        console.log('âœ“ Connected to signaling server');
        setIsConnected(true);
        // Join room with data
        socketRef.current.emit('join-room', { roomId });
      });

      // Join the video room via API
      await api.post('/video/rooms/join', { roomId });

      // Set up Socket.io event listeners
      setupSocketListeners();

      // Start stats monitoring
      startStatsMonitoring();

    } catch (error) {
      console.error('Failed to initialize video room:', error);
      setError(`Failed to initialize video room: ${error.message}`);
    }
  };

  // Setup Socket.io event listeners for WebRTC signaling
  const setupSocketListeners = () => {
    const socket = socketRef.current;

    // Handle existing participants when joining
    socket.on('existing-participants', async (data) => {
      console.log('Existing participants:', data.participants);
      setParticipants(data.participants);
      
      // Create peer connections with existing participants
      // They will create offers for us
      for (const participant of data.participants) {
        // Initialize ICE candidate queue for this peer
        iceCandidateQueueRef.current[participant.socketId] = [];
      }
    });

    // Handle new user joining the room
    socket.on('user-joined', async (data) => {
      console.log('New user joined:', data);
      setParticipants(prev => [...prev, data]);
      
      // Initialize ICE candidate queue
      iceCandidateQueueRef.current[data.socketId] = [];
      
      // WE create offer for the new user (we're already here)
      await createPeerConnection(data.socketId, true);
    });

    // Handle user leaving
    socket.on('user-left', (data) => {
      console.log('User left:', data.socketId);
      const { socketId } = data;
      
      // Close peer connection
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      
      // Clear ICE queue
      delete iceCandidateQueueRef.current[socketId];
      
      // Remove from participants list
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      
      // Remove remote stream
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
    });

    // Handle offer - responder side
    socket.on('offer', async (data) => {
      const { from, offer, fromInfo } = data;
      console.log('Received offer from:', from);
      
      try {
        // Create peer connection if not exists
        let peerConnection = peerConnectionsRef.current[from];
        if (!peerConnection) {
          peerConnection = await createPeerConnection(from, false);
        }
        
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Process queued ICE candidates
        if (iceCandidateQueueRef.current[from]) {
          for (const candidate of iceCandidateQueueRef.current[from]) {
            try {
              await peerConnection.addIceCandidate(candidate);
            } catch (error) {
              console.error('Error adding queued ICE candidate:', error);
            }
          }
          iceCandidateQueueRef.current[from] = [];
        }
        
        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { 
          roomId, 
          targetSocketId: from, 
          answer 
        });
        
        console.log('Answer sent to:', from);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle answer - offerer side
    socket.on('answer', async (data) => {
      const { from, answer } = data;
      console.log('Received answer from:', from);
      
      try {
        const peerConnection = peerConnectionsRef.current[from];
        if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          
          // Process queued ICE candidates
          if (iceCandidateQueueRef.current[from]) {
            for (const candidate of iceCandidateQueueRef.current[from]) {
              try {
                await peerConnection.addIceCandidate(candidate);
              } catch (error) {
                console.error('Error adding queued ICE candidate:', error);
              }
            }
            iceCandidateQueueRef.current[from] = [];
          }
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', async (data) => {
      const { from, candidate } = data;
      
      try {
        const peerConnection = peerConnectionsRef.current[from];
        if (!peerConnection) {
          // Peer connection not yet created, queue the candidate
          if (!iceCandidateQueueRef.current[from]) {
            iceCandidateQueueRef.current[from] = [];
          }
          iceCandidateQueueRef.current[from].push(new RTCIceCandidate(candidate));
        } else if (peerConnection.remoteDescription) {
          // Remote description is set, add candidate immediately
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        } else {
          // Remote description not yet set, queue the candidate
          if (!iceCandidateQueueRef.current[from]) {
            iceCandidateQueueRef.current[from] = [];
          }
          iceCandidateQueueRef.current[from].push(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error processing ICE candidate:', error);
      }
    });

    // Chat messages
    socket.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });
  };

  // Create peer connection for a specific remote user
  // isOfferer = true means we will create offer, false means we wait for offer
  const createPeerConnection = async (remoteSocketId, isOfferer) => {
    console.log(`Creating peer connection with ${remoteSocketId} (offerer: ${isOfferer})`);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
      ],
    });

    peerConnectionsRef.current[remoteSocketId] = peerConnection;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', remoteSocketId);
      if (event.streams && event.streams.length > 0) {
        setRemoteStreams(prev => ({
          ...prev,
          [remoteSocketId]: event.streams[0],
        }));
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          targetSocketId: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteSocketId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        // TODO: Implement reconnection logic
        console.warn(`Connection failed with ${remoteSocketId}`);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${remoteSocketId}:`, peerConnection.iceConnectionState);
    };

    // Create offer if we're the initiator
    if (isOfferer) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current.emit('offer', {
          roomId,
          targetSocketId: remoteSocketId,
          offer,
        });
        console.log('Offer sent to:', remoteSocketId);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return peerConnection;
  };

  // Monitor WebRTC stats
  const startStatsMonitoring = () => {
    statsIntervalRef.current = setInterval(async () => {
      const newStats = {};
      
      for (const [socketId, peerConnection] of Object.entries(peerConnectionsRef.current)) {
        try {
          const stats = await peerConnection.getStats();
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              newStats[socketId] = {
                bitrate: Math.round((report.bytesReceived * 8) / 1000) + ' kbps',
                framesDecoded: report.framesDecoded,
                packetsLost: report.packetsLost,
              };
            }
          });
        } catch (error) {
          console.error('Error getting stats:', error);
        }
      }
      
      if (Object.keys(newStats).length > 0) {
        setStats(newStats);
      }
    }, 2000);
  };

  // Cleanup
  const cleanupVideoRoom = () => {
    // Clear stats interval
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      try {
        pc.close();
      } catch (error) {
        console.error('Error closing peer connection:', error);
      }
    });
    peerConnectionsRef.current = {};

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.error('Error stopping track:', error);
        }
      });
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
      socketRef.current.disconnect();
    }
  };

  // Audio/Video controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
      });
      setIsScreenSharing(true);

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenVideoTrack).catch(error => 
            console.error('Error replacing track:', error)
          );
        }
      });

      // Update local video display
      const combinedStream = new MediaStream([
        ...localStreamRef.current.getAudioTracks(),
        screenVideoTrack,
      ]);
      setLocalStream(combinedStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = combinedStream;
      }

      // Handle screen share end
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      if (error.name !== 'NotAllowedError') {
        console.error('Screen sharing failed:', error);
      }
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);

    // Get original camera track
    const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!cameraVideoTrack) return;

    // Replace back to camera in all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(cameraVideoTrack).catch(error =>
          console.error('Error replacing track:', error)
        );
      }
    });

    // Update local video display
    setLocalStream(localStreamRef.current);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const startRecording = async () => {
    try {
      setRecordingStatus('recording');
      const response = await api.post('/recordings/start', {
        sessionId,
        classId,
      });
      console.log('Recording started:', response.data);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingStatus('idle');
    }
  };

  const stopRecording = async () => {
    try {
      setRecordingStatus('processing');
      const mockVideoUrl = 'https://example.com/video.mp4';

      await api.post('/recordings/complete', {
        recordingId: 'temp-id',
        videoUrl: mockVideoUrl,
        duration: 3600,
      });

      setRecordingStatus('idle');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingStatus('idle');
    }
  };

  const sendChatMessage = async () => {
    if (chatInput.trim() && socketRef.current) {
      const messageData = {
        message: chatInput,
        sender: 'You',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, messageData]);
      setChatInput('');

      socketRef.current.emit('chat-message', {
        message: chatInput,
        roomId,
      });
    }
  };

  const endSession = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
      }
      await api.post('/video/rooms/leave', { roomId });
      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  return (
    <div className="video-room">
      {error && <div className="alert alert-error" style={{margin:12}}>{error}</div>}
      <div className="video-container">
        <div className="videos-grid">
          {/* Local video */}
          <div className="video-tile local">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
            />
            <span className="video-label">ðŸ“¹ You</span>
          </div>

          {/* Remote video tiles */}
          {participants.map((participant) => {
            const stream = remoteStreams[participant.socketId];
            return (
              <div 
                key={participant.socketId} 
                className={`video-tile remote ${activeSpeaker === participant.socketId ? 'speaker' : ''}`}
              >
                {stream ? (
                  <video
                    ref={(el) => {
                      if (el && el.srcObject !== stream) {
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="video-element"
                  />
                ) : (
                  <div className="video-placeholder">Loading...</div>
                )}
                <span className="video-label">ðŸ‘¤ {participant.email.split('@')[0]}</span>
                {stats[participant.socketId] && (
                  <span className="video-stats">{stats[participant.socketId].bitrate}</span>
                )}
              </div>
            );
          })}

          {/* Empty message if alone */}
          {participants.length === 0 && (
            <div className="video-tile empty">
              <span>Waiting for participants...</span>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? `Connected (${participants.length + 1} participants)` : 'Disconnected'}</span>
        </div>

        {/* Controls */}
        <div className="controls">
          <button
            className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
            onClick={toggleAudio}
            title="Toggle Audio"
          >
            ðŸŽ¤ {isAudioEnabled ? 'On' : 'Off'}
          </button>

          <button
            className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
            onClick={toggleVideo}
            title="Toggle Video"
          >
            ðŸŽ¥ {isVideoEnabled ? 'On' : 'Off'}
          </button>

          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            title="Share Screen"
          >
            ðŸ“º {isScreenSharing ? 'Stop' : 'Share'}
          </button>

          <button
            className={`control-btn ${recordingStatus === 'recording' ? 'recording' : ''}`}
            onClick={recordingStatus === 'idle' ? startRecording : stopRecording}
            title="Record Session"
          >
            â­• {recordingStatus}
          </button>

          <button
            className="control-btn end-session"
            onClick={endSession}
            title="End Session"
          >
            â˜Žï¸ Leave
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="chat-panel">
        <h3>ðŸ’¬ Chat</h3>
        <div className="messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="message">
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendChatMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

