/**
 * React Native - Live Streaming Screen
 * Mobile real-time video streaming with WebRTC
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { RTCView, mediaDevices, RTCPeerConnection } from 'react-native-webrtc';
import api from '../utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LiveStreamScreen = ({ route, navigation, user }) => {
  const { streamId } = route.params;
  const [stream, setStream] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [quality, setQuality] = useState('auto');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadStreamData();
    setupWebSocket();

    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [streamId]);

  const loadStreamData = async () => {
    try {
      const response = await api.get(`/streams/${streamId}`);
      setRoomData(response.data);
      setStream(response.data);
      
      if (response.data.status === 'live') {
        setIsStreaming(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load stream data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socketRef.current = new WebSocket(
      `${wsProtocol}//${window.location.host}/ws/stream/${streamId}`
    );

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'viewer-joined':
          setViewers((prev) => [...prev, data.viewer]);
          break;
        case 'viewer-left':
          setViewers((prev) => prev.filter((v) => v.id !== data.viewerId));
          break;
        case 'chat-message':
          console.log('New message:', data.message);
          break;
        default:
          break;
      }
    };
  };

  const startStreaming = async () => {
    try {
      setLoading(true);

      // Request camera and microphone permissions
      const constraints = {
        audio: { echoCancellation: true },
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await mediaDevices.getUserMedia(constraints);
      setLocalStream(mediaStream);

      // Setup peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      mediaStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, mediaStream);
      });

      peerConnectionRef.current = peerConnection;

      // Send to server
      await api.post(`/streams/${streamId}/start`, {
        quality,
      });

      setIsStreaming(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start streaming: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopStreaming = async () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      await api.post(`/streams/${streamId}/stop`);
      setIsStreaming(false);
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Video Area */}
        <View style={styles.videoContainer}>
          {localStream && isStreaming ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.video}
              mirror={true}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.placeholderText}>📹 Camera Preview</Text>
            </View>
          )}

          {/* Stream Info Overlay */}
          <View style={styles.streamInfo}>
            <Text style={styles.streamTitle}>{stream?.title}</Text>
            <View style={styles.viewersCount}>
              <Text style={styles.viewersText}>👥 {viewers.length} watching</Text>
            </View>
          </View>
        </View>

        {/* Stream Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>{stream?.title}</Text>
          <Text style={styles.detailsDescription}>{stream?.description}</Text>

          {/* Host Info */}
          <View style={styles.hostInfo}>
            <Text style={styles.hostLabel}>Host</Text>
            <Text style={styles.hostName}>{stream?.host?.name}</Text>
          </View>

          {/* Quality Selector */}
          <View style={styles.qualitySelector}>
            <Text style={styles.label}>Stream Quality</Text>
            <View style={styles.qualityOptions}>
              {['auto', '720p', '480p', '360p'].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityOption,
                    quality === q && styles.qualityOptionActive,
                  ]}
                  onPress={() => setQuality(q)}
                  disabled={isStreaming}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      quality === q && styles.qualityTextActive,
                    ]}
                  >
                    {q.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controls}>
            {!isStreaming ? (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={startStreaming}
              >
                <Text style={styles.buttonText}>🎬 Start Stream</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.iconButton]}
                  onPress={toggleMute}
                >
                  <Text style={styles.buttonText}>{isMuted ? '🔇' : '🎤'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.iconButton]}
                  onPress={toggleCamera}
                >
                  <Text style={styles.buttonText}>{isCameraOff ? '🚫' : '📹'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopStreaming}
                >
                  <Text style={styles.buttonText}>⏹️ Stop Stream</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flexGrow: 1,
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight * 0.5,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
  },
  streamInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewersCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  hostInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  hostLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qualitySelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  qualityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  qualityOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  qualityTextActive: {
    color: '#fff',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#ff4757',
  },
  iconButton: {
    flex: 0.3,
    backgroundColor: '#667eea',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LiveStreamScreen;
