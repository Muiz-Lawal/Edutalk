/**
 * Email Notification Service
 * Handles sending emails for achievements, certificates, and milestones
 */

export const emailNotificationService = {
  /**
   * Send achievement unlocked notification
   */
  sendAchievementNotification: async (userId, achievement, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/achievement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          achievement: {
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            unlockedAt: new Date()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send achievement email (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Achievement notification error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send course completion notification
   */
  sendCompletionNotification: async (userId, courseData, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/completion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          course: {
            name: courseData.name,
            completedAt: new Date(),
            certificateId: courseData.certificateId,
            score: courseData.score
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send completion email (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Completion notification error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send milestone reached notification
   */
  sendMilestoneNotification: async (userId, milestone, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/milestone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          milestone: {
            type: milestone.type, // e.g., 'streak_7_days', 'courses_completed_5', 'hours_watched_100'
            title: milestone.title,
            description: milestone.description,
            reward: milestone.reward,
            reachedAt: new Date()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send milestone email (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Milestone notification error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send progress reminder
   */
  sendProgressReminder: async (userId, enrollmentData, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/reminder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          enrollment: {
            courseId: enrollmentData.courseId,
            courseName: enrollmentData.courseName,
            currentProgress: enrollmentData.currentProgress,
            hoursRemaining: enrollmentData.hoursRemaining,
            nextSessionDate: enrollmentData.nextSessionDate
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send reminder email (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Reminder notification error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send certificate issued notification
   */
  sendCertificateNotification: async (userId, certificateData, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/certificate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          certificate: {
            certificateId: certificateData.certificateId,
            certificateNumber: certificateData.certificateNumber,
            courseName: certificateData.courseName,
            studentName: certificateData.studentName,
            completionDate: certificateData.completionDate,
            verificationCode: certificateData.verificationCode,
            shareableLink: certificateData.shareableLink
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send certificate email (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Certificate notification error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to email notifications
   */
  subscribeToNotifications: async (userId, preferences, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          preferences: {
            achievements: preferences.achievements !== false,
            milestones: preferences.milestones !== false,
            completions: preferences.completions !== false,
            reminders: preferences.reminders !== false,
            certificates: preferences.certificates !== false,
            frequency: preferences.frequency || 'instant' // instant, daily, weekly
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update notification preferences (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Subscription error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification preferences
   */
  getNotificationPreferences: async (userId, token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notification preferences (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Preferences fetch error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default emailNotificationService;
