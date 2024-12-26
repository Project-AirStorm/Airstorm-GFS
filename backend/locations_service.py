import csv
import os
from flask import jsonify


class LocationService:
    def __init__(self):
        self.locations_file = 'data/locations.csv'
        self._ensure_data_directory()
        self._initialize_csv()

    def _ensure_data_directory(self):
        os.makedirs('data', exist_ok=True)

    def _initialize_csv(self):
        if not os.path.exists(self.locations_file):
            with open(self.locations_file, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(['user_id', 'name', 'latitude',
                                'longitude', 'is_favorite'])

    def save_location(self, user_id, name, latitude, longitude, is_favorite=False):
        with open(self.locations_file, 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([user_id, name, latitude, longitude, is_favorite])
        return True

    def get_user_locations(self, user_id):
        locations = []
        try:
            with open(self.locations_file, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['user_id'] == user_id:
                        locations.append({
                            'name': row['name'],
                            'latitude': float(row['latitude']),
                            'longitude': float(row['longitude']),
                            # Changed to match frontend
                            'isFavorite': row['is_favorite'].lower() == 'true'
                        })
        except FileNotFoundError:
            return []
        return locations

    def toggle_favorite(self, user_id, latitude, longitude):
        locations = []
        updated = False

        with open(self.locations_file, 'r') as file:
            reader = csv.DictReader(file)
            locations = list(reader)

        for location in locations:
            if (location['user_id'] == user_id and
                float(location['latitude']) == latitude and
                    float(location['longitude']) == longitude):
                location['is_favorite'] = str(
                    not location['is_favorite'].lower() == 'true')
                updated = True
                break

        if updated:
            with open(self.locations_file, 'w', newline='') as file:
                writer = csv.DictWriter(
                    file, fieldnames=['user_id', 'name', 'latitude', 'longitude', 'is_favorite'])
                writer.writeheader()
                writer.writerows(locations)

        return updated

    def delete_location(self, user_id, latitude, longitude):
        """
        Delete a location for a specific user based on coordinates.

        Args:
            user_id (str): The ID of the user
            latitude (float): The latitude of the location
            longitude (float): The longitude of the location

        Returns:
            bool: True if location was deleted, False otherwise
        """
        locations = []
        location_deleted = False

        # Read all locations
        try:
            with open(self.locations_file, 'r') as file:
                reader = csv.DictReader(file)
                locations = list(reader)
        except FileNotFoundError:
            return False

        # Filter out the location to be deleted
        filtered_locations = [
            loc for loc in locations
            if not (
                loc['user_id'] == user_id and
                # Using small epsilon for float comparison
                abs(float(loc['latitude']) - latitude) < 0.0001 and
                abs(float(loc['longitude']) - longitude) < 0.0001
            )
        ]

        location_deleted = len(filtered_locations) < len(locations)

        if location_deleted:
            # Write back the remaining locations
            with open(self.locations_file, 'w', newline='') as file:
                writer = csv.DictWriter(
                    file,
                    fieldnames=['user_id', 'name', 'latitude',
                                'longitude', 'is_favorite']
                )
                writer.writeheader()
                writer.writerows(filtered_locations)

        return location_deleted
