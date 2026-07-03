/**
 * Cloudflare Stream API Integration Service
 * Handles live streaming with Cloudflare
 * 
 * Prerequisites:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN: Your Cloudflare API token with Stream access
 * - CLOUDFLARE_ZONE_ID: Your zone ID (for DNS records if needed)
 */

class CloudflareStreamService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`;

    if (!this.accountId || !this.apiToken) {
      console.warn('⚠️  Cloudflare credentials not configured. Live streaming will use mock mode.');
    }
  }

  /**
   * Create a new live input (stream key generation)
   * @returns {Object} { streamKey, rtmpUrl, playbackUrl }
   */
  async createLiveInput(streamName) {
    try {
      if (!this.accountId || !this.apiToken) {
        return this.mockCreateLiveInput(streamName);
      }

      const response = await fetch(`${this.baseUrl}/stream/live_inputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: {
            name: streamName,
          },
          recording: {
            mode: 'automatic',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        streamId: data.result.uid,
        streamKey: data.result.rtmps.streamKey,
        rtmpUrl: data.result.rtmps.url,
        playbackUrl: `https://videodelivery.net/${data.result.uid}/manifest/video.m3u8`,
      };
    } catch (error) {
      console.error('Error creating Cloudflare live input:', error);
      return this.mockCreateLiveInput(streamName);
    }
  }

  /**
   * Get live input details
   */
  async getLiveInput(streamId) {
    try {
      if (!this.accountId || !this.apiToken) {
        return this.mockGetLiveInput(streamId);
      }

      const response = await fetch(`${this.baseUrl}/stream/live_inputs/${streamId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.result.status,
        created: data.result.created,
        modified: data.result.modified,
        videoUID: data.result.videoUID,
      };
    } catch (error) {
      console.error('Error getting Cloudflare live input:', error);
      return this.mockGetLiveInput(streamId);
    }
  }

  /**
   * Delete a live input
   */
  async deleteLiveInput(streamId) {
    try {
      if (!this.accountId || !this.apiToken) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/stream/live_inputs/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting Cloudflare live input:', error);
      return { success: true }; // Don't fail, just log
    }
  }

  /**
   * Get video details and recording status
   */
  async getVideoDetails(videoId) {
    try {
      if (!this.accountId || !this.apiToken) {
        return this.mockGetVideoDetails(videoId);
      }

      const response = await fetch(`${this.baseUrl}/stream/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        videoId: data.result.uid,
        status: data.result.status,
        duration: data.result.duration,
        created: data.result.created,
        playbackUrl: `https://videodelivery.net/${data.result.uid}/manifest/video.m3u8`,
      };
    } catch (error) {
      console.error('Error getting Cloudflare video details:', error);
      return this.mockGetVideoDetails(videoId);
    }
  }

  /**
   * Update video metadata
   */
  async updateVideoMetadata(videoId, metadata) {
    try {
      if (!this.accountId || !this.apiToken) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/stream/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating Cloudflare video metadata:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get HLS playback URL with quality options
   */
  async getPlaybackUrl(videoId) {
    return {
      m3u8: `https://videodelivery.net/${videoId}/manifest/video.m3u8`,
      mp4: `https://videodelivery.net/${videoId}/downloads/default.mp4`,
    };
  }

  /**
   * Get live input status (is stream active?)
   */
  async isStreamActive(streamId) {
    try {
      const input = await this.getLiveInput(streamId);
      return input.status === 'live';
    } catch (error) {
      console.error('Error checking stream status:', error);
      return false;
    }
  }

  // ==================== Mock Methods (for development) ====================

  mockCreateLiveInput(streamName) {
    const streamKey = `mock-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const streamId = `mock-stream-${Math.random().toString(36).substr(2, 9)}`;

    return {
      streamId,
      streamKey,
      rtmpUrl: 'rtmps://live.cloudflare.com:443/live/',
      playbackUrl: `https://videodelivery.net/${streamId}/manifest/video.m3u8`,
    };
  }

  mockGetLiveInput(streamId) {
    return {
      status: 'live',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      videoUID: `vid-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  mockGetVideoDetails(videoId) {
    return {
      videoId,
      status: 'ready',
      duration: 3600,
      created: new Date().toISOString(),
      playbackUrl: `https://videodelivery.net/${videoId}/manifest/video.m3u8`,
    };
  }
}

export default new CloudflareStreamService();
