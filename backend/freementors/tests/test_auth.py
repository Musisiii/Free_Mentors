"""
Auth tests for Free Mentors GraphQL API.
"""
import pytest
from django.test import TestCase, RequestFactory
from graphene_django.views import GraphQLView
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
import graphql_jwt


REGISTER_MUTATION = """
mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    register(email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
        success
        errors
        user {
            id
            email
            role
        }
    }
}
"""

LOGIN_MUTATION = """
mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
        success
        errors
        token
        user {
            email
            role
        }
    }
}
"""


@pytest.mark.django_db
class TestRegistration:
    def test_registration_creates_user_with_default_role(self):
        """Registration creates a user in the database with USER role."""
        from graphene_django.views import GraphQLView
        
        result = schema.execute(
            REGISTER_MUTATION,
            variables={
                "email": "newuser@test.com",
                "password": "TestPassword123!",
                "firstName": "Test",
                "lastName": "User",
            }
        )
        
        assert result.errors is None
        assert result.data["register"]["success"] is True
        assert result.data["register"]["errors"] == []
        assert result.data["register"]["user"]["email"] == "newuser@test.com"
        assert result.data["register"]["user"]["role"] == "USER"
        
        # Verify user exists in DB
        user = CustomUser.objects.get(email="newuser@test.com")
        assert user is not None
        assert user.role == RoleChoices.USER

    def test_registration_fails_with_duplicate_email(self):
        """Registration fails if email already exists."""
        CustomUser.objects.create_user(
            email="existing@test.com",
            password="TestPassword123!",
            first_name="Existing",
            last_name="User",
        )
        
        result = schema.execute(
            REGISTER_MUTATION,
            variables={
                "email": "existing@test.com",
                "password": "TestPassword123!",
                "firstName": "Duplicate",
                "lastName": "User",
            }
        )
        
        assert result.errors is None
        assert result.data["register"]["success"] is False
        assert len(result.data["register"]["errors"]) > 0

    def test_registration_stores_hashed_password(self):
        """Registration stores a hashed password, not plain text."""
        result = schema.execute(
            REGISTER_MUTATION,
            variables={
                "email": "hashtest@test.com",
                "password": "PlainPassword123!",
                "firstName": "Hash",
                "lastName": "Test",
            }
        )
        
        assert result.data["register"]["success"] is True
        
        user = CustomUser.objects.get(email="hashtest@test.com")
        assert user.password != "PlainPassword123!"
        assert user.check_password("PlainPassword123!")


@pytest.mark.django_db
class TestLogin:
    def setup_method(self):
        self.user = CustomUser.objects.create_user(
            email="logintest@test.com",
            password="TestPassword123!",
            first_name="Login",
            last_name="Test",
            role=RoleChoices.USER,
        )

    def test_login_returns_jwt_token(self):
        """Login with valid credentials returns a JWT token."""
        result = schema.execute(
            LOGIN_MUTATION,
            variables={
                "email": "logintest@test.com",
                "password": "TestPassword123!",
            }
        )
        
        assert result.errors is None
        assert result.data["login"]["success"] is True
        assert result.data["login"]["token"] is not None
        assert len(result.data["login"]["token"]) > 10
        assert result.data["login"]["user"]["email"] == "logintest@test.com"

    def test_login_fails_with_wrong_password(self):
        """Login returns a GraphQL error with invalid credentials."""
        result = schema.execute(
            LOGIN_MUTATION,
            variables={
                "email": "logintest@test.com",
                "password": "WrongPassword!",
            }
        )
        
        assert result.errors is None
        assert result.data["login"]["success"] is False
        assert len(result.data["login"]["errors"]) > 0
        assert result.data["login"]["token"] is None

    def test_login_fails_with_nonexistent_email(self):
        """Login returns error for non-existent email."""
        result = schema.execute(
            LOGIN_MUTATION,
            variables={
                "email": "notregistered@test.com",
                "password": "TestPassword123!",
            }
        )
        
        assert result.errors is None
        assert result.data["login"]["success"] is False
        assert len(result.data["login"]["errors"]) > 0
