"""
Business logic tests for Free Mentors GraphQL API.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from unittest.mock import MagicMock
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
from mentorship.models import MentorshipSession, Review, SessionStatus


CREATE_SESSION_MUTATION = """
mutation CreateSession($mentorId: ID!, $questions: String!, $scheduledAt: DateTime!, $durationMinutes: Int!) {
    createSession(mentorId: $mentorId, questions: $questions, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes) {
        success
        errors
        session {
            id
            status
            questions
            scheduledAt
            durationMinutes
        }
    }
}
"""

UPDATE_SESSION_STATUS_MUTATION = """
mutation UpdateSessionStatus($sessionId: ID!, $status: String!, $rejectReason: String) {
    updateSessionStatus(sessionId: $sessionId, status: $status, rejectReason: $rejectReason) {
        success
        errors
        session {
            id
            status
            rejectReason
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
        scheduledAt
        durationMinutes
        rejectReason
    }
}
"""


def make_context(user):
    """Create a mock request context with the given user."""
    request = MagicMock()
    request.user = user
    return request


def future_dt(minutes=60):
    """Return a datetime `minutes` in the future (ISO string)."""
    return (timezone.now() + timedelta(minutes=minutes)).isoformat()


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
                "scheduledAt": future_dt(120),
                "durationMinutes": 45,
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
        assert session.duration_minutes == 45

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
                "scheduledAt": future_dt(120),
                "durationMinutes": 30,
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
                "scheduledAt": future_dt(120),
                "durationMinutes": 30,
            },
            context_value=context,
        )

        assert result.errors is None
        assert result.data["createSession"]["success"] is False
        assert "Mentor not found" in result.data["createSession"]["errors"][0]

    def test_cannot_create_session_with_self(self):
        """A mentor cannot request a session with themselves."""
        context = make_context(self.mentor)
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "Self-session?",
                "scheduledAt": future_dt(120),
                "durationMinutes": 30,
            },
            context_value=context,
        )
        assert result.data["createSession"]["success"] is False
        assert "yourself" in result.data["createSession"]["errors"][0].lower()

    def test_cannot_create_session_in_past(self):
        """Scheduled time must be at least 10 minutes in the future."""
        context = make_context(self.mentee)
        past_dt = (timezone.now() - timedelta(hours=1)).isoformat()
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "Past session?",
                "scheduledAt": past_dt,
                "durationMinutes": 30,
            },
            context_value=context,
        )
        assert result.data["createSession"]["success"] is False
        assert "10 minutes" in result.data["createSession"]["errors"][0]

    def test_cannot_create_session_with_zero_duration(self):
        """Duration must be positive."""
        context = make_context(self.mentee)
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "Zero duration?",
                "scheduledAt": future_dt(120),
                "durationMinutes": 0,
            },
            context_value=context,
        )
        assert result.data["createSession"]["success"] is False
        assert "positive" in result.data["createSession"]["errors"][0].lower()


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
            scheduled_at=timezone.now() + timedelta(hours=2),
            duration_minutes=30,
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

    def test_reject_stores_reason(self):
        """Rejecting with a reason stores that reason."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "REJECTED",
                "rejectReason": "I am unavailable that day.",
            },
            context_value=context,
        )

        assert result.data["updateSessionStatus"]["success"] is True
        self.session.refresh_from_db()
        assert self.session.reject_reason == "I am unavailable that day."

    def test_reject_without_reason_sets_default(self):
        """Rejecting without a reason sets a default."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "REJECTED",
            },
            context_value=context,
        )

        assert result.data["updateSessionStatus"]["success"] is True
        self.session.refresh_from_db()
        assert self.session.reject_reason == "No reason provided."


@pytest.mark.django_db
class TestSessionStatusEdgeCases:
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
            questions="Edge case test",
            status=SessionStatus.PENDING,
            scheduled_at=timezone.now() + timedelta(hours=2),
            duration_minutes=30,
        )

    def test_invalid_status_value_rejected(self):
        """An invalid status string is rejected."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "INVALID_STATUS",
            },
            context_value=context,
        )
        assert result.data["updateSessionStatus"]["success"] is False
        assert "Invalid status" in result.data["updateSessionStatus"]["errors"][0]

    def test_nonexistent_session_returns_error(self):
        """Updating a nonexistent session returns an error."""
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": "99999",
                "status": "ACCEPTED",
            },
            context_value=context,
        )
        assert result.data["updateSessionStatus"]["success"] is False
        assert "not found" in result.data["updateSessionStatus"]["errors"][0].lower()

    def test_unauthenticated_cannot_update_status(self):
        """Unauthenticated user cannot update session status."""
        anon = MagicMock()
        anon.is_authenticated = False
        context = make_context(anon)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "ACCEPTED",
            },
            context_value=context,
        )
        assert result.data["updateSessionStatus"]["success"] is False
        assert "Authentication" in result.data["updateSessionStatus"]["errors"][0]

    def test_mentor_can_mark_session_completed(self):
        """A mentor can mark an accepted session as completed."""
        self.session.status = SessionStatus.ACCEPTED
        self.session.save()
        context = make_context(self.mentor)
        result = schema.execute(
            UPDATE_SESSION_STATUS_MUTATION,
            variables={
                "sessionId": str(self.session.id),
                "status": "COMPLETED",
            },
            context_value=context,
        )
        assert result.data["updateSessionStatus"]["success"] is True
        assert result.data["updateSessionStatus"]["session"]["status"] == "COMPLETED"


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
            scheduled_at=timezone.now() + timedelta(hours=2),
            duration_minutes=30,
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


@pytest.mark.django_db
class TestSessionConflictDetection:
    def setup_method(self):
        self.mentee = CustomUser.objects.create_user(
            email="mentee@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentee",
            role=RoleChoices.USER,
        )
        self.mentee2 = CustomUser.objects.create_user(
            email="mentee2@test.com",
            password="TestPassword123!",
            first_name="Second",
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
        self.base_time = timezone.now() + timedelta(hours=5)
        MentorshipSession.objects.create(
            mentee=self.mentee,
            mentor=self.mentor,
            questions="Existing session.",
            status=SessionStatus.ACCEPTED,
            scheduled_at=self.base_time,
            duration_minutes=60,
        )

    def test_overlapping_session_is_rejected(self):
        """A second session overlapping an existing one is rejected."""
        context = make_context(self.mentee2)
        overlap_time = (self.base_time + timedelta(minutes=30)).isoformat()
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "Overlap attempt",
                "scheduledAt": overlap_time,
                "durationMinutes": 30,
            },
            context_value=context,
        )
        assert result.data["createSession"]["success"] is False
        assert "another session" in result.data["createSession"]["errors"][0].lower()

    def test_non_overlapping_session_succeeds(self):
        """A session after the existing one succeeds."""
        context = make_context(self.mentee2)
        after_time = (self.base_time + timedelta(minutes=61)).isoformat()
        result = schema.execute(
            CREATE_SESSION_MUTATION,
            variables={
                "mentorId": str(self.mentor.id),
                "questions": "After existing session",
                "scheduledAt": after_time,
                "durationMinutes": 30,
            },
            context_value=context,
        )
        assert result.data["createSession"]["success"] is True


@pytest.mark.django_db
class TestAutoRejectExpired:
    def test_expired_pending_sessions_get_auto_rejected(self):
        """Querying mySessions auto-rejects expired PENDING sessions."""
        mentee = CustomUser.objects.create_user(
            email="mentee@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentee",
            role=RoleChoices.USER,
        )
        mentor = CustomUser.objects.create_user(
            email="mentor@test.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="Mentor",
            role=RoleChoices.MENTOR,
            expertise="Tech",
        )
        session = MentorshipSession.objects.create(
            mentee=mentee,
            mentor=mentor,
            questions="Old session",
            status=SessionStatus.PENDING,
            scheduled_at=timezone.now() - timedelta(hours=1),
            duration_minutes=30,
        )

        context = make_context(mentee)
        schema.execute(MY_SESSIONS_QUERY, context_value=context)

        session.refresh_from_db()
        assert session.status == SessionStatus.REJECTED
        assert "couldn't accept" in session.reject_reason.lower()