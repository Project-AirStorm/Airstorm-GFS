# backend/github_service.py
import os
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

class GitHubService:
    """
    Service class for interacting with GitHub Issues API
    """

    def __init__(self):
        self.token = os.getenv('BACKEND_GITHUB_ACCESS_TOKEN')
        self.owner = os.getenv('BACKEND_GITHUB_OWNER')
        self.repo = os.getenv('BACKEND_GITHUB_REPO')
        self.api_url = f"https://api.github.com/repos/{self.owner}/{self.repo}"

        if not all([self.token, self.owner, self.repo]):
            raise ValueError("Missing required GitHub configuration")

    def create_issue(self, title, body, labels=None, milestone=None):
        """
        Create a new GitHub issue

        Args:
            title (str): Issue title
            body (str): Issue description/body
            labels (list): List of label names to apply
            milestone (int): Milestone number to associate

        Returns:
            dict: Created issue data or None if failed
        """
        try:
            headers = {
                'Authorization': f'token {self.token}',
                'Accept': 'application/vnd.github.v3+json'
            }

            # Prepare the issue template
            issue_body = f"""
### User Information
**Name:** {body.get('name')}
**Email:** {body.get('email')}

### Feedback Details
{body.get('description')}
"""

            data = {
                'title': title,
                'body': issue_body,
                'labels': labels or []
            }

            if milestone:
                data['milestone'] = milestone

            response = requests.post(
                f"{self.api_url}/issues",
                headers=headers,
                json=data
            )
            response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to create GitHub issue: {str(e)}")
            return None

    def get_milestones(self):
        """
        Get available milestones from the repository

        Returns:
            list: List of milestone objects or empty list if failed
        """
        try:
            headers = {
                'Authorization': f'token {self.token}',
                'Accept': 'application/vnd.github.v3+json'
            }

            response = requests.get(
                f"{self.api_url}/milestones",
                headers=headers
            )
            response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch milestones: {str(e)}")
            return []
