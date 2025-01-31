from random import randint

class WeatherAnalyzer:
    #Declaring static avoids the need to use 'self' in this class
    @staticmethod
    def get_weather_condition(code):
        """Map weather codes to readable conditions"""
        conditions = {
            0: "clear",
            1: "fair",
            2: "partly cloudy",
            3: "cloudy",
            45: "foggy",
            48: "foggy",
            51: "light drizzle",
            53: "drizzle",
            55: "heavy drizzle",
            61: "light rain",
            63: "rain",
            65: "heavy rain",
            71: "light snow",
            73: "snow",
            75: "heavy snow",
            95: "thunderstorm",
        }
        return conditions.get(code, "fair")
    @staticmethod
    def calculate_air_quality(current):
        """
        Calculate air quality index based on available metrics
        This is a placeholder - implement based on your specific needs
        """
        # For demo purposes, return a random number between 50-80
        return randint(50, 80)