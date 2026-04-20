"""
Permission tests for Free Mentors GraphQL API.
"""
import pytest
from unittest.mock import MagicMock
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
import graphql_jwt


ALL_USERS_QUERY = """
query {
    allUsers {
        id
        email
        role
    }
}
"""

TOGGLE_MENTOR_STATUS_MUTATION = """
mutation ToggleMentorStatus($userId: ID!) {
    toggleMentorStatus(userId: $userId) {
        success
        errors
        user {
            email
            role
        }
    }
}
"""

ADD_ADMIN_MUTATION = """
mutation AddAdmin($email: String!) {
    addAdmin(email: $email) {
        success
        errors
        user {
            email
            role
        }
    }
}
"""


def make_context(user):
    """Create a mock request context with the given user."""
    request = MagicMock()
    request.user = user
    return request


@pytest.mark.django_db
class TestAllUsersPermissions:
    def setup_method(self):
        self.regular_user = CustomUser.objects.create_user(
            email="regular@test.com",
            password="TestPassword123!",
            first_name="Regular",
            last_name="User",
            role=RoleChoices.USER,
        )
        self.admin_user = CustomUser.objects.create_user(
            email="admin@test.com",
            password="TestPassword123!",
            first_name="Admin",
            last_name="User",
            role=RoleChoices.ADMIN,
            is_staff=True,
        )

    def test_regular_user_cannot_access_all_users(self):
        """A standard USER cannot call allUsers."""
        context = make_context(self.regular_user)
        result = schema.execute(ALL_USERS_QUERY, context_value=context)
        
        assert result.errors is not None
        assert len(result.errors) > 0
        error_message = str(result.errors[0])
        assert "Admin" in error_message or "admin" in error_message

    def test_unauthenticated_user_cannot_access_all_users(self):
        """An unauthenticated user cannot call allUsers."""
        anon_user = MagicMock()
        anon_user.is_authenticated = False
        context = make_context(anon_user)
        
        result = schema.execute(ALL_USERS_QUERY, context_value=context)
        
        assert result.errors is not None
        assert len(result.errors) > 0

    def test_admin_can_access_all_users(self):
        """An ADMIN can call allUsers."""
        context = make_context(self.admin_user)
        result = schema.execute(ALL_USERS_QUERY, context_value=context)
        
        assert result.errors is None
        assert result.data["allUsers"] is not None
        assert len(result.data["allUsers"]) >= 2


@pytest.mark.django_db
class TestRoleChangePermissions:
    def setup_method(self):
        self.regular_user = CustomUser.objects.create_user(
            email="user@test.com",
            password="TestPassword123!",
            first_name="Regular",
            last_name="User",
            role=RoleChoices.USER,
        )
        self.admin_user = CustomUser.objects.create_user(
            email="admin@test.com",
            password="TestPassword123!",
            first_name="Admin",
            last_name="User",
            role=RoleChoices.ADMIN,
            is_staff=True,
        )

    def test_user_cannot_toggle_mentor_status(self):
        """A regular USER cannot use toggleMentorStatus."""
        context = make_context(self.regular_user)
        result = schema.execute(
            TOGGLE_MENTOR_STATUS_MUTATION,
            variables={"userId": str(self.regular_user.id)},
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["toggleMentorStatus"]["success"] is False
        assert "Admin" in result.data["toggleMentorStatus"]["errors"][0] or \
               "admin" in result.data["toggleMentorStatus"]["errors"][0]

    def test_user_cannot_add_admin(self):
        """A regular USER cannot grant admin role to others."""
        context = make_context(self.regular_user)
        result = schema.execute(
            ADD_ADMIN_MUTATION,
            variables={"email": self.regular_user.email},
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["addAdmin"]["success"] is False
        
        self.regular_user.refresh_from_db()
        assert self.regular_user.role != RoleChoices.ADMIN

    def test_user_cannot_change_own_role_to_admin(self):
        """A USER cannot change their own role to ADMIN via addAdmin."""
        context = make_context(self.regular_user)
        result = schema.execute(
            ADD_ADMIN_MUTATION,
            variables={"email": self.regular_user.email},
            context_value=context,
        )
        
        assert result.data["addAdmin"]["success"] is False
        
        self.regular_user.refresh_from_db()
        assert self.regular_user.role == RoleChoices.USER

    def test_admin_can_toggle_mentor_status(self):
        """An ADMIN can toggle user to mentor role."""
        context = make_context(self.admin_user)
        result = schema.execute(
            TOGGLE_MENTOR_STATUS_MUTATION,
            variables={"userId": str(self.regular_user.id)},
            context_value=context,
        )
        
        assert result.errors is None
        assert result.data["toggleMentorStatus"]["success"] is True
        assert result.data["toggleMentorStatus"]["user"]["role"] == "MENTOR"
