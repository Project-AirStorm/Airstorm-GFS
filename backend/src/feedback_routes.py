# backend/feedback_routes.py
from flask import Blueprint, request, jsonify
from github_service import GitHubService
import logging

# Initialize blueprint and GitHub service
feedback_bp = Blueprint('feedback', __name__)
github_service = GitHubService()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@feedback_bp.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Handle feedback submission and create GitHub issue

    Expected JSON payload:
    {
        "ticketName": "string",
        "name": "string",
        "email": "string",
        "description": "string",
        "tag": "string",
        "milestone": "number" (optional)
    }

    Returns:
        JSON response with success/error message and issue data if successful
    """
    try:
        data = request.json
        required_fields = ['ticketName', 'name', 'email', 'description', 'tag']

        # Validate required fields
        if not all(field in data for field in required_fields):
            missing_fields = [
                field for field in required_fields if field not in data]
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400

        # Validate email format (basic validation)
        if '@' not in data['email']:
            return jsonify({
                'error': 'Invalid email format'
            }), 400

        # Parse milestone if provided
        milestone = None
        if 'milestone' in data and data['milestone']:
            try:
                milestone = int(data['milestone'])
            except ValueError:
                return jsonify({
                    'error': 'Invalid milestone format'
                }), 400

        # Sanitize and prepare labels
        labels = [data['tag'], 'user-feedback']
        labels = list(set(labels))  # Remove duplicates

        # Create GitHub issue
        issue = github_service.create_issue(
            title=data['ticketName'],
            body=data,
            labels=labels,
            milestone=milestone
        )

        if not issue:
            return jsonify({
                'error': 'Failed to create GitHub issue'
            }), 500

        logger.info(f"Successfully created GitHub issue: {issue['number']}")

        return jsonify({
            'message': 'Feedback submitted successfully',
            'issue': {
                'number': issue['number'],
                'url': issue['html_url'],
                'title': issue['title']
            }
        })

    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({
            'error': 'Internal server error while processing feedback'
        }), 500


@feedback_bp.route('/api/feedback/milestones', methods=['GET'])
def get_milestones():
    """
    Get available milestones from GitHub repository

    Returns:
        JSON response with list of milestones or error message
    """
    try:
        milestones = github_service.get_milestones()

        # Format milestone data for frontend
        formatted_milestones = [{
            'number': milestone['number'],
            'title': milestone['title'],
            'description': milestone['description'],
            'open_issues': milestone['open_issues'],
            'due_on': milestone['due_on']
        } for milestone in milestones]

        return jsonify({
            'milestones': formatted_milestones
        })

    except Exception as e:
        logger.error(f"Error fetching milestones: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch milestones'
        }), 500


@feedback_bp.route('/api/feedback/labels', methods=['GET'])
def get_labels():
    """
    Get available labels for feedback

    Returns:
        JSON response with predefined list of available labels
    """
    try:
        # Predefined labels available for feedback
        labels = [
            {'value': 'bug', 'label': 'Bug', 'color': '0075ca'},
            {'value': 'question', 'label': 'Question', 'color': '0075ca'},
            {'value': 'feature', 'label': 'Feature', 'color': '0075ca'}
        ]

        return jsonify({
            'labels': labels
        })

    except Exception as e:
        logger.error(f"Error fetching labels: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch labels'
        }), 500


@feedback_bp.errorhandler(404)
def handle_404(e):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Feedback endpoint not found'
    }), 404


@feedback_bp.errorhandler(500)
def handle_500(e):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error in feedback service'
    }), 500
