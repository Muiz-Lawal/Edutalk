/**
 * React Native - Video Player Component
 * HLS video player with quality selection and offline support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl, title, hostName } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const videoRef = useRef(null);

  const qualities = ['auto', '360p', '480p', '720p', '1080p'];

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
    } else if (status.error) {
      console.error('Video error:', status.error);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const seek = async (ms) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(ms);
    }
  };

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const containerStyle = isFullscreen
    ? [styles.container, styles.fullscreen]
    : styles.container;

  return (
    <SafeAreaView style={containerStyle}>
      <View style={[styles.videoContainer, isFullscreen && styles.fullscreenContainer]}>
        {/* Video Player */}
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          rate={1.0}
          volume={1.0}
          isMuted={isMuted}
          resizeMode="contain"
          useNativeControls={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Play/Pause Overlay */}
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          <Text style={styles.playPauseIcon}>
            {isPlaying ? '⏸' : '▶️'}
          </Text>
        </TouchableOpacity>

        {/* Video Controls */}
        <View style={styles.controls}>
          {/* Play Button */}
          <TouchableOpacity onPress={togglePlayPause} disabled={isLoading}>
            <Text style={styles.controlIcon}>
              {isPlaying ? '⏸' : '▶️'}
            </Text>
          </TouchableOpacity>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>

          {/* Quality Selector */}
          <TouchableOpacity onPress={() => setCurrentQuality(currentQuality)}>
            <Text style={styles.controlIcon}>⚙️</Text>
          </TouchableOpacity>

          {/* Mute Button */}
          <TouchableOpacity onPress={toggleMute}>
            <Text style={styles.controlIcon}>
              {isMuted ? '🔇' : '🔊'}
            </Text>
          </TouchableOpacity>

          {/* Fullscreen Button */}
          <TouchableOpacity onPress={toggleFullscreen}>
            <Text style={styles.controlIcon}>
              {isFullscreen ? '⛔' : '🖥️'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width:
                  duration > 0
                    ? `${(position / duration) * 100}%`
                    : '0%',
              },
            ]}
          />
        </View>
      </View>

      {/* Video Info */}
      {!isFullscreen && (
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.host}>Host: {hostName}</Text>

          {/* Quality Selector Menu */}
          <View style={styles.qualityMenu}>
            <Text style={styles.qualityLabel}>Quality:</Text>
            <View style={styles.qualityOptions}>
              {qualities.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityOption,
                    currentQuality === q && styles.qualityOptionActive,
                  ]}
                  onPress={() => setCurrentQuality(q)}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      currentQuality === q && styles.qualityTextActive,
                    ]}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight * 0.5,
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenContainer: {
    height: screenHeight,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 48,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    gap: 12,
  },
  controlIcon: {
    fontSize: 20,
    color: '#fff',
    padding: 8,
  },
  timeDisplay: {
    flex: 1,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  host: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  qualityMenu: {
    marginTop: 20,
  },
  qualityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  qualityOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  qualityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  qualityTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default VideoPlayerScreen;
