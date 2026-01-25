/**
 * Google Calendar Service
 * Handles Google Calendar integration for talent application meetings
 */

import { google } from 'googleapis';
import { logger } from '../utils/logger';

export class GoogleCalendarService {
  private calendar;
  private auth;

  constructor() {
    // Initialize OAuth2 client
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );

    // Set credentials if refresh token is available
    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      this.auth.setCredentials({
        refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Create a calendar event for talent meet & greet
   */
  async createMeetingEvent(data: {
    email: string;
    firstName: string;
    lastName: string;
    preferredMeetingTime: string;
    profileId: string;
  }): Promise<{ eventId: string; meetLink: string; startTime: string; endTime: string } | null> {
    try {
      // Parse the preferred meeting time and create a date
      // For now, we'll schedule it for next Thursday at the selected time
      const now = new Date();
      const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
      const meetingDate = new Date(now);
      meetingDate.setDate(now.getDate() + daysUntilThursday);

      // Parse time from string like "10:00 AM"
      const timeMatch = data.preferredMeetingTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) {
        logger.error('Invalid time format:', data.preferredMeetingTime);
        return null;
      }

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const meridiem = timeMatch[3].toUpperCase();

      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }

      meetingDate.setHours(hours, minutes, 0, 0);

      // Set to PST timezone (UTC-8)
      const startTime = new Date(meetingDate.getTime());
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes

      const event = {
        summary: `Knacksters Talent Meet & Greet - ${data.firstName} ${data.lastName}`,
        description: `Meet & greet with ${data.firstName} ${data.lastName} to discuss their expertise and potential opportunities at Knacksters.\n\nProfile ID: ${data.profileId}\nEmail: ${data.email}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        attendees: [
          { email: data.email },
          { email: process.env.KNACKSTERS_TEAM_EMAIL || 'connect@knacksters.co' },
        ],
        conferenceData: {
          createRequest: {
            requestId: `talent-${data.profileId}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'email', minutes: 60 },      // 1 hour before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send invitations to all attendees
      });

      const eventData = response.data;
      const meetLink = eventData.conferenceData?.entryPoints?.[0]?.uri || eventData.hangoutLink || '';

      logger.info(`Calendar event created for ${data.email}: ${eventData.id}`);

      return {
        eventId: eventData.id || '',
        meetLink,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to create calendar event:', error);
      
      // Log specific Google API errors
      if (error.response) {
        logger.error('Google API Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      // Return null instead of throwing to allow the application to continue
      // even if calendar creation fails
      return null;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateMeetingEvent(
    eventId: string,
    updates: {
      startTime?: Date;
      endTime?: Date;
      status?: 'confirmed' | 'cancelled';
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.startTime && updates.endTime) {
        updateData.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        };
        updateData.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        };
      }

      if (updates.status) {
        updateData.status = updates.status;
      }

      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updateData,
        sendUpdates: 'all',
      });

      logger.info(`Calendar event updated: ${eventId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to update calendar event:', error);
      return false;
    }
  }

  /**
   * Cancel a calendar event
   */
  async cancelMeetingEvent(eventId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });

      logger.info(`Calendar event cancelled: ${eventId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to cancel calendar event:', error);
      return false;
    }
  }
}

export default new GoogleCalendarService();
