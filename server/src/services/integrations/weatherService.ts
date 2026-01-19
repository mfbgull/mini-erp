/**
 * Weather Service (Weatherstack Integration)
 * Handles weather data for delivery planning and operations
 */

import axios from 'axios';
import db from '../../config/database';

interface WeatherData {
  location: {
    name: string;
    country: string;
    region: string;
    lat: number;
    lon: number;
    timezone_id: string;
    localtime: string;
  };
  current: {
    observation_time: string;
    temperature: number;
    weather_code: number;
    weather_descriptions: string[];
    wind_speed: number;
    wind_degree: number;
    wind_dir: string;
    pressure: number;
    precip: number;
    humidity: number;
    cloudcover: number;
    feelslike: number;
    uv_index: number;
    visibility: number;
    is_day: string;
  };
}

class WeatherService {
  private apiKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl: string = 'http://api.weatherstack.com';

  constructor() {
    this.loadSettings();
  }

  /**
   * Load Weatherstack settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'weather_%'").all() as any[];

      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'weather_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'weather_api_key':
            this.apiKey = setting.value;
            break;
        }
      });
    } catch (error) {
      console.error('[WeatherService] Failed to load settings:', error);
    }
  }

  /**
   * Reload settings (call after updating settings)
   */
  reloadSettings(): void {
    this.loadSettings();
  }

  /**
   * Check if service is enabled and configured
   */
  isConfigured(): boolean {
    return this.enabled && !!this.apiKey;
  }

  /**
   * Get weather data for a location
   */
  async getWeather(location: string): Promise<{ success: boolean; data?: WeatherData; message?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Weather service not configured or disabled'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/current`, {
        params: {
          access_key: this.apiKey,
          query: location
        }
      });

      if ((response.data as any).error) {
        return {
          success: false,
          message: (response.data as any).error?.info || 'Failed to fetch weather data'
        };
      }

      return {
        success: true,
        data: response.data as WeatherData
      };

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[WeatherService] Failed to fetch weather:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch weather data'
      };
    }
  }

  /**
   * Check if weather is suitable for delivery
   */
  async isWeatherSuitableForDelivery(
    location: string,
    maxTemperature: number = 40,
    maxWindSpeed: number = 50
  ): Promise<{ success: boolean; suitable: boolean; data?: WeatherData; message?: string }> {
    const result = await this.getWeather(location);

    if (!result.success || !result.data) {
      return {
        success: false,
        suitable: false,
        message: result.message || 'Failed to check weather'
      };
    }

    const { current } = result.data;

    // Weather is suitable if:
    // 1. Temperature is within reasonable range
    // 2. Wind speed is not too high
    // 3. Not extreme weather (codes for rain, storm, etc.)
    const isSuitable =
      current.temperature <= maxTemperature &&
      current.wind_speed <= maxWindSpeed &&
      ![95, 96, 99].includes(current.weather_code); // Thunderstorm, heavy rain, etc.

    let message = 'Weather is suitable for delivery';
    if (!isSuitable) {
      if (current.temperature > maxTemperature) {
        message = `Temperature too high: ${current.temperature}°C`;
      } else if (current.wind_speed > maxWindSpeed) {
        message = `Wind speed too high: ${current.wind_speed} km/h`;
      } else {
        message = `Adverse weather: ${current.weather_descriptions[0]}`;
      }
    }

    return {
      success: true,
      suitable: isSuitable,
      data: result.data,
      message
    };
  }

  /**
   * Get weather summary for dashboard
   */
  async getWeatherSummary(location: string): Promise<{
    temperature: string;
    description: string;
    wind: string;
    humidity: string;
    icon?: string;
  } | null> {
    const result = await this.getWeather(location);

    if (!result.success || !result.data) {
      return null;
    }

    const { current } = result.data;

    return {
      temperature: `${current.temperature}°C`,
      description: current.weather_descriptions[0] || 'N/A',
      wind: `${current.wind_speed} km/h ${current.wind_dir}`,
      humidity: `${current.humidity}%`
    };
  }

  /**
   * Get default location weather
   */
  async getDefaultLocationWeather(): Promise<WeatherData | null> {
    try {
      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('weather_default_location') as any;

      if (!setting?.value) {
        return null;
      }

      const result = await this.getWeather(setting.value);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('[WeatherService] Failed to get default location weather:', error);
      return null;
    }
  }
}

// Export singleton instance
const weatherService = new WeatherService();

export default weatherService;
export const getWeather = (...args: Parameters<typeof weatherService.getWeather>) => weatherService.getWeather(...args);
export const isWeatherSuitableForDelivery = (...args: Parameters<typeof weatherService.isWeatherSuitableForDelivery>) => weatherService.isWeatherSuitableForDelivery(...args);
export const getWeatherSummary = (...args: Parameters<typeof weatherService.getWeatherSummary>) => weatherService.getWeatherSummary(...args);
export const getDefaultLocationWeather = (...args: Parameters<typeof weatherService.getDefaultLocationWeather>) => weatherService.getDefaultLocationWeather(...args);
