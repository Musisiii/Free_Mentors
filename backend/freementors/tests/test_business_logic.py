"""
Business logic tests for Free Mentors GraphQL API.
"""
import pytest
from unittest.mock import MagicMock
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
from mentorship.models import MentorshipSession, Review, SessionStatus


CREATE_SESSION_MUTATION = """
mutation CreateSession($mentorId: ID!, $questions: String!) {
    createSession(mentorId: $mentorId, questions: $questions) {
        success
        errors
        session {
            id
            status
            questions
        }
    }
}
"""

UPDATE_SESSION_STATUS_MUTATION = """
mutation UpdateSessionStatus($sessionId: ID!, $status: String!) {
    updateSessionStatus(sessionId: $sessionId, status: $status) {
        success
        errors
        session {
            id
            status
        }
    }
}
"""

MY_SESSIONS_QUERY = """
query {
    mySessions {
        id
        status
        questions
    }
}
"""


def make_context(user):
    """Create a mock request context with the given user."""
    request = MagicMock()
    request.user = user
    return request


@pytest.mark.django_db
class TestSessionCreation:
    def setup_method(self):
        self.mentee = CustomUser.objects.create_user(
            email="mentee@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentee",
            role=RoleChoices.USER,
        )
        self.mentor = CustomUser.objects.create_user(
            email="mentor@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentor",
            role=RoleChoices.MENTOR,
            expertise="Tech",
        )

    def test_create_session_defaults_to_pending(self):
        """Creating a session defaults status to PENDING."""
        context = make_context(self.mentee)
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "How do I get started with Python?",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["createSession"]["success"] is True
        assert result.data["createSession"]["session"]["status"] == "PENDING"
        
        session = MentorshipSession.objects.get(
            id=result.data["createSession"]["session"]["id"]
        )
        assert session.status == SessionStatus.PENDING

    def test_unauthenticated_user_cannot_create_session(self):
        """Unauthenticated user cannot create a session."""
        anon_user = MagicMock()
        anon_user.is_authenticated = False
        context = make_context(anon_user)
        
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "Some question.",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["createSession"]["success"] is False

    def test_cannot_create_session_with_nonexistent_mentor(self):
        """Creating a session with invalid mentor ID returns error."""
        context = make_context(self.mentee)
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": "99999",
                "questions": "Some question.",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["createSession"]["success"] is False
        assert "Mentor not found" in result.data["createSession"]["errors"][0]


@pytest.mark.django_db
class TestSessionStatusUpdate:
    def setup_method(self):
        self.mentee = CustomUser.objects.create_user(
            email="mentee@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentee",
            role=RoleChoices.USER,
        )
        self.mentor = CustomUser.objects.create_user(
            email="mentor@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentor",
            role=RoleChoices.MENTOR,
            expertise="Tech",
        )
        self.other_mentor = CustomUser.objects.create_user(
            email="other_mentor@test.com",
            password="TestPassword123!",
            first_name="Other",
            last_name="Mentor",
            role=RoleChoices.MENTOR,
            expertise="Finance",
        )
        self.session = MentorshipSession.objects.create(
            mentee=self.mentee,
            mentor=self.mentor,
            questions="How do I learn Django?",
            status=SessionStatus.PENDING,
        )

    def test_mentor_can_accept_their_session(self):
        """A mentor can accept a session assigned to them."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "ACCEPTED",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["updateSessionStatus"]["success"] is True
        assert result.data["updateSessionStatus"]["session"]["status"] == "ACCEPTED"

    def test_mentor_cannot_accept_session_that_isnt_theirs(self):
        """A mentor cannot accept a session that isn't assigned to them."""
        context = make_context(self.other_mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "ACCEPTED",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["updateSessionStatus"]["success"] is False
        assert "assigned to you" in result.data["updateSessionStatus"]["errors"][0]

    def test_regular_user_cannot_update_session_status(self):
        """A regular USER cannot update session status."""
        context = make_context(self.mentee)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "ACCEPTED",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["updateSessionStatus"]["success"] is False
        assert "mentor" in result.data["updateSessionStatus"]["errors"][0].lower()

    def test_mentor_can_reject_session(self):
        """A mentor can reject a session assigned to them."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "REJECTED",
            },
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["updateSessionStatus"]["success"] is True
        assert result.data["updateSessionStatus"]["session"]["status"] == "REJECTED"


@pytest.mark.django_db
class TestSessionQueryByRole:
    def setup_method(self):
        self.mentee = CustomUser.objects.create_user(
            email="mentee@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentee",
            role=RoleChoices.USER,
        )
        self.mentor = CustomUser.objects.create_user(
            email="mentor@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentor",
            role=RoleChoices.MENTOR,
            expertise="Tech",
        )
        self.session = MentorshipSession.objects.create(
            mentee=self.mentee,
            mentor=self.mentor,
            questions="Test question for role-based query test.",
            status=SessionStatus.PENDING,
        )

    def test_mentee_sees_their_sessions(self):
        """A mentee sees sessions they requested."""
        context = make_context(self.mentee)
        result = schema.execute(MY_SESSIONS_QUERY, context_value=context)
        
        assert result.errors is None
        session_ids = [s["id"] for s in result.data["mySessions"]]
        assert str(self.session.id) in session_ids

    def test_mentor_sees_sessions_assigned_to_them(self):
        """A mentor sees sessions assigned to them."""
        context = make_context(self.mentor)
        result = schema.execute(MY_SESSIONS_QUERY, context_value=context)
        
        assert result.errors is None
        session_ids = [s["id"] for s in result.data["mySessions"]]
        assert str(self.session.id) in session_ids
