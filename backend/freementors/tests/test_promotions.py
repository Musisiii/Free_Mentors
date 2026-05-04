"""
Promotion request tests for Free Mentors GraphQL API.
Covers: CreatePromotionRequest, ResolvePromotionRequest, myPromotionRequest,
allPromotionRequests.
"""
import pytest
from unittest.mock import MagicMock
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
from mentorship.models import PromotionRequest, PromotionStatus


CREATE_PROMOTION = """
mutation CreatePromotionRequest($expertise: String!, $occupation: String!) {
    createPromotionRequest(expertise: $expertise, occupation: $occupation) {
        success
        errors
        request { id expertise occupation status }
    }
}
"""

RESOLVE_PROMOTION = """
mutation ResolvePromotionRequest($requestId: ID!, $approve: Boolean!) {
    resolvePromotionRequest(requestId: $requestId, approve: $approve) {
        success
        errors
        request { id status }
    }
}
"""

MY_PROMOTION = """
query {
    myPromotionRequest {
        id
        expertise
        occupation
        status
    }
}
"""

ALL_PROMOTIONS = """
query {
    allPromotionRequests {
        id
        expertise
        status
        user { email role }
    }
}
"""


def ctx(user):
    req = MagicMock()
    req.user = user
    return req


def anon_ctx():
    anon = MagicMock()
    anon.is_authenticated = False
    return ctx(anon)


@pytest.fixture
def users(db):
    admin = CustomUser.objects.create_user(
        email="admin@test.com", password="Pass123!",
        first_name="Admin", last_name="X", role=RoleChoices.ADMIN, is_staff=True,
    )
    user = CustomUser.objects.create_user(
        email="user@test.com", password="Pass123!",
        first_name="User", last_name="U", role=RoleChoices.USER,
    )
    mentor = CustomUser.objects.create_user(
        email="mentor@test.com", password="Pass123!",
        first_name="Mentor", last_name="M", role=RoleChoices.MENTOR, expertise="Tech",
    )
    return {"admin": admin, "user": user, "mentor": mentor}


@pytest.mark.django_db
class TestCreatePromotionRequest:
    def test_user_can_request_promotion(self, users):
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "Python", "occupation": "Developer"},
            context_value=ctx(users["user"]),
        )
        assert result.errors is None
        assert result.data["createPromotionRequest"]["success"] is True
        assert result.data["createPromotionRequest"]["request"]["status"] == "PENDING"
        assert result.data["createPromotionRequest"]["request"]["expertise"] == "Python"
        assert result.data["createPromotionRequest"]["request"]["occupation"] == "Developer"

    def test_mentor_cannot_request_promotion(self, users):
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "Art", "occupation": "Artist"},
            context_value=ctx(users["mentor"]),
        )
        assert result.data["createPromotionRequest"]["success"] is False
        assert "regular users" in result.data["createPromotionRequest"]["errors"][0].lower() or \
               "user" in result.data["createPromotionRequest"]["errors"][0].lower()

    def test_cannot_have_duplicate_pending(self, users):
        PromotionRequest.objects.create(
            user=users["user"], expertise="First", occupation="Dev",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "Second", "occupation": "Dev2"},
            context_value=ctx(users["user"]),
        )
        assert result.data["createPromotionRequest"]["success"] is False
        assert "pending" in result.data["createPromotionRequest"]["errors"][0].lower()

    def test_expertise_required(self, users):
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "   ", "occupation": "Dev"},
            context_value=ctx(users["user"]),
        )
        assert result.data["createPromotionRequest"]["success"] is False
        assert "expertise" in result.data["createPromotionRequest"]["errors"][0].lower()

    def test_occupation_required(self, users):
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "Python", "occupation": "   "},
            context_value=ctx(users["user"]),
        )
        assert result.data["createPromotionRequest"]["success"] is False
        assert "occupation" in result.data["createPromotionRequest"]["errors"][0].lower()

    def test_unauthenticated_cannot_request(self, users):
        result = schema.execute(
            CREATE_PROMOTION,
            variables={"expertise": "X", "occupation": "Y"},
            context_value=anon_ctx(),
        )
        assert result.data["createPromotionRequest"]["success"] is False


@pytest.mark.django_db
class TestResolvePromotionRequest:
    def test_admin_approve_promotes_user(self, users):
        promo = PromotionRequest.objects.create(
            user=users["user"], expertise="Python", occupation="Developer",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_PROMOTION,
            variables={"requestId": str(promo.id), "approve": True},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolvePromotionRequest"]["success"] is True
        assert result.data["resolvePromotionRequest"]["request"]["status"] == "APPROVED"

        users["user"].refresh_from_db()
        assert users["user"].role == RoleChoices.MENTOR
        assert users["user"].expertise == "Python"
        assert users["user"].occupation == "Developer"

    def test_admin_reject_keeps_user_role(self, users):
        promo = PromotionRequest.objects.create(
            user=users["user"], expertise="Art", occupation="Artist",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_PROMOTION,
            variables={"requestId": str(promo.id), "approve": False},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolvePromotionRequest"]["success"] is True
        assert result.data["resolvePromotionRequest"]["request"]["status"] == "REJECTED"

        users["user"].refresh_from_db()
        assert users["user"].role == RoleChoices.USER

    def test_cannot_resolve_already_resolved(self, users):
        promo = PromotionRequest.objects.create(
            user=users["user"], expertise="Done", occupation="Done",
            status=PromotionStatus.APPROVED,
        )
        result = schema.execute(
            RESOLVE_PROMOTION,
            variables={"requestId": str(promo.id), "approve": True},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolvePromotionRequest"]["success"] is False
        assert "already" in result.data["resolvePromotionRequest"]["errors"][0].lower()

    def test_non_admin_cannot_resolve(self, users):
        promo = PromotionRequest.objects.create(
            user=users["user"], expertise="Hack", occupation="Hacker",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_PROMOTION,
            variables={"requestId": str(promo.id), "approve": True},
            context_value=ctx(users["user"]),
        )
        assert result.data["resolvePromotionRequest"]["success"] is False


@pytest.mark.django_db
class TestPromotionQueries:
    def test_my_promotion_returns_latest(self, users):
        PromotionRequest.objects.create(
            user=users["user"], expertise="Old", occupation="Dev",
            status=PromotionStatus.REJECTED,
        )
        PromotionRequest.objects.create(
            user=users["user"], expertise="New", occupation="Dev2",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(MY_PROMOTION, context_value=ctx(users["user"]))
        assert result.errors is None
        assert result.data["myPromotionRequest"]["expertise"] == "New"
        assert result.data["myPromotionRequest"]["status"] == "PENDING"

    def test_all_promotions_admin_only(self, users):
        PromotionRequest.objects.create(
            user=users["user"], expertise="X", occupation="Y",
            status=PromotionStatus.PENDING,
        )
        result = schema.execute(ALL_PROMOTIONS, context_value=ctx(users["admin"]))
        assert result.errors is None
        assert len(result.data["allPromotionRequests"]) >= 1

        result_user = schema.execute(ALL_PROMOTIONS, context_value=ctx(users["user"]))
        assert result_user.errors is not None

    def test_unauthenticated_has_no_promotion(self, users):
        result = schema.execute(MY_PROMOTION, context_value=anon_ctx())
        assert result.data["myPromotionRequest"] is None