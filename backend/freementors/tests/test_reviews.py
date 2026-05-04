"""
Review tests for Free Mentors GraphQL API.
Covers: CreateReview, resolve_all_reviews visibility, HideReview,
RequestReviewHide, ResolveReviewHideRequest.
"""
import pytest
from unittest.mock import MagicMock
from freementors_project.schema import schema
from users.models import CustomUser, RoleChoices
from mentorship.models import (
    MentorshipSession,
    Review,
    SessionStatus,
    HideRequestStatus,
)


CREATE_REVIEW = """
mutation CreateReview($mentorId: ID!, $remark: String!, $score: Int!) {
    createReview(mentorId: $mentorId, remark: $remark, score: $score) {
        success
        errors
        review { id remark score isHidden }
    }
}
"""

ALL_REVIEWS = """
query {
    allReviews {
        id
        remark
        score
        isHidden
        hideRequestStatus
        mentor { id }
        mentee { id }
    }
}
"""

HIDE_REVIEW = """
mutation HideReview($reviewId: ID!) {
    hideReview(reviewId: $reviewId) {
        success
        errors
        review { id isHidden }
    }
}
"""

REQUEST_REVIEW_HIDE = """
mutation RequestReviewHide($reviewId: ID!) {
    requestReviewHide(reviewId: $reviewId) {
        success
        errors
        review { id hideRequestStatus }
    }
}
"""

RESOLVE_REVIEW_HIDE_REQUEST = """
mutation ResolveReviewHideRequest($reviewId: ID!, $approve: Boolean!) {
    resolveReviewHideRequest(reviewId: $reviewId, approve: $approve) {
        success
        errors
        review { id isHidden hideRequestStatus }
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
    mentor = CustomUser.objects.create_user(
        email="mentor@test.com", password="Pass123!",
        first_name="Mentor", last_name="M", role=RoleChoices.MENTOR, expertise="Tech",
    )
    mentee = CustomUser.objects.create_user(
        email="mentee@test.com", password="Pass123!",
        first_name="Mentee", last_name="U", role=RoleChoices.USER,
    )
    mentee2 = CustomUser.objects.create_user(
        email="mentee2@test.com", password="Pass123!",
        first_name="Mentee2", last_name="U2", role=RoleChoices.USER,
    )
    return {"admin": admin, "mentor": mentor, "mentee": mentee, "mentee2": mentee2}


@pytest.fixture
def completed_session(users):
    return MentorshipSession.objects.create(
        mentee=users["mentee"], mentor=users["mentor"],
        questions="Done.", status=SessionStatus.COMPLETED,
    )


@pytest.mark.django_db
class TestCreateReview:
    def test_mentee_can_review_after_completed_session(self, users, completed_session):
        result = schema.execute(
            CREATE_REVIEW,
            variables={"mentorId": str(users["mentor"].id), "remark": "Great!", "score": 5},
            context_value=ctx(users["mentee"]),
        )
        assert result.errors is None
        assert result.data["createReview"]["success"] is True
        assert result.data["createReview"]["review"]["score"] == 5

    def test_cannot_review_without_completed_session(self, users):
        result = schema.execute(
            CREATE_REVIEW,
            variables={"mentorId": str(users["mentor"].id), "remark": "Nope", "score": 3},
            context_value=ctx(users["mentee"]),
        )
        assert result.data["createReview"]["success"] is False
        assert "completing a session" in result.data["createReview"]["errors"][0].lower() or \
               "completed" in result.data["createReview"]["errors"][0].lower()

    def test_score_must_be_between_1_and_5(self, users, completed_session):
        for bad_score in [0, 6, -1]:
            result = schema.execute(
                CREATE_REVIEW,
                variables={"mentorId": str(users["mentor"].id), "remark": "Bad", "score": bad_score},
                context_value=ctx(users["mentee"]),
            )
            assert result.data["createReview"]["success"] is False

    def test_unauthenticated_cannot_review(self, users):
        result = schema.execute(
            CREATE_REVIEW,
            variables={"mentorId": str(users["mentor"].id), "remark": "Hi", "score": 3},
            context_value=anon_ctx(),
        )
        assert result.data["createReview"]["success"] is False

    def test_cannot_review_nonexistent_mentor(self, users, completed_session):
        result = schema.execute(
            CREATE_REVIEW,
            variables={"mentorId": "99999", "remark": "Who?", "score": 3},
            context_value=ctx(users["mentee"]),
        )
        assert result.data["createReview"]["success"] is False
        assert "Mentor not found" in result.data["createReview"]["errors"][0]


@pytest.mark.django_db
class TestReviewVisibility:
    def _seed(self, users, completed_session):
        visible = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Visible review", score=4,
        )
        hidden = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee2"],
            remark="Hidden review", score=2, is_hidden=True,
        )
        return visible, hidden

    def test_admin_sees_all_reviews(self, users, completed_session):
        v, h = self._seed(users, completed_session)
        result = schema.execute(ALL_REVIEWS, context_value=ctx(users["admin"]))
        ids = [r["id"] for r in result.data["allReviews"]]
        assert str(v.id) in ids
        assert str(h.id) in ids

    def test_mentor_sees_visible_plus_own(self, users, completed_session):
        v, h = self._seed(users, completed_session)
        result = schema.execute(ALL_REVIEWS, context_value=ctx(users["mentor"]))
        ids = [r["id"] for r in result.data["allReviews"]]
        assert str(v.id) in ids
        assert str(h.id) in ids

    def test_mentee_sees_visible_plus_own(self, users, completed_session):
        v, h = self._seed(users, completed_session)
        result = schema.execute(ALL_REVIEWS, context_value=ctx(users["mentee"]))
        ids = [r["id"] for r in result.data["allReviews"]]
        assert str(v.id) in ids
        assert str(h.id) not in ids

    def test_mentee2_sees_hidden_own_review(self, users, completed_session):
        v, h = self._seed(users, completed_session)
        result = schema.execute(ALL_REVIEWS, context_value=ctx(users["mentee2"]))
        ids = [r["id"] for r in result.data["allReviews"]]
        assert str(v.id) in ids
        assert str(h.id) in ids

    def test_anonymous_sees_only_visible(self, users, completed_session):
        v, h = self._seed(users, completed_session)
        result = schema.execute(ALL_REVIEWS, context_value=anon_ctx())
        ids = [r["id"] for r in result.data["allReviews"]]
        assert str(v.id) in ids
        assert str(h.id) not in ids


@pytest.mark.django_db
class TestHideReview:
    def test_admin_can_toggle_hide(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Toggle me", score=3,
        )
        assert review.is_hidden is False

        result = schema.execute(
            HIDE_REVIEW,
            variables={"reviewId": str(review.id)},
            context_value=ctx(users["admin"]),
        )
        assert result.data["hideReview"]["success"] is True
        assert result.data["hideReview"]["review"]["isHidden"] is True

        result2 = schema.execute(
            HIDE_REVIEW,
            variables={"reviewId": str(review.id)},
            context_value=ctx(users["admin"]),
        )
        assert result2.data["hideReview"]["review"]["isHidden"] is False

    def test_non_admin_cannot_hide_review(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Cannot hide", score=4,
        )
        for u in [users["mentor"], users["mentee"]]:
            result = schema.execute(
                HIDE_REVIEW,
                variables={"reviewId": str(review.id)},
                context_value=ctx(u),
            )
            assert result.data["hideReview"]["success"] is False


@pytest.mark.django_db
class TestRequestReviewHide:
    def test_mentor_can_request_hide_on_own_review(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Flag me", score=2,
        )
        result = schema.execute(
            REQUEST_REVIEW_HIDE,
            variables={"reviewId": str(review.id)},
            context_value=ctx(users["mentor"]),
        )
        assert result.data["requestReviewHide"]["success"] is True
        assert result.data["requestReviewHide"]["review"]["hideRequestStatus"] == "PENDING"

    def test_mentor_cannot_request_hide_on_others_review(self, users, completed_session):
        other_mentor = CustomUser.objects.create_user(
            email="other@test.com", password="Pass123!",
            first_name="Other", last_name="M", role=RoleChoices.MENTOR, expertise="Art",
        )
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Not yours", score=3,
        )
        result = schema.execute(
            REQUEST_REVIEW_HIDE,
            variables={"reviewId": str(review.id)},
            context_value=ctx(other_mentor),
        )
        assert result.data["requestReviewHide"]["success"] is False

    def test_cannot_double_request(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Double", score=2, hide_request_status=HideRequestStatus.PENDING,
        )
        result = schema.execute(
            REQUEST_REVIEW_HIDE,
            variables={"reviewId": str(review.id)},
            context_value=ctx(users["mentor"]),
        )
        assert result.data["requestReviewHide"]["success"] is False
        assert "already pending" in result.data["requestReviewHide"]["errors"][0].lower()

    def test_non_mentor_cannot_request_hide(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="User tries", score=4,
        )
        result = schema.execute(
            REQUEST_REVIEW_HIDE,
            variables={"reviewId": str(review.id)},
            context_value=ctx(users["mentee"]),
        )
        assert result.data["requestReviewHide"]["success"] is False


@pytest.mark.django_db
class TestResolveReviewHideRequest:
    def test_admin_approve_hides_review(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Approve me", score=1, hide_request_status=HideRequestStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_REVIEW_HIDE_REQUEST,
            variables={"reviewId": str(review.id), "approve": True},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolveReviewHideRequest"]["success"] is True
        assert result.data["resolveReviewHideRequest"]["review"]["isHidden"] is True
        assert result.data["resolveReviewHideRequest"]["review"]["hideRequestStatus"] == "APPROVED"

    def test_admin_reject_keeps_review_visible(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Reject me", score=1, hide_request_status=HideRequestStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_REVIEW_HIDE_REQUEST,
            variables={"reviewId": str(review.id), "approve": False},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolveReviewHideRequest"]["success"] is True
        assert result.data["resolveReviewHideRequest"]["review"]["isHidden"] is False
        assert result.data["resolveReviewHideRequest"]["review"]["hideRequestStatus"] == "REJECTED"

    def test_cannot_resolve_if_not_pending(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Not pending", score=3,
        )
        result = schema.execute(
            RESOLVE_REVIEW_HIDE_REQUEST,
            variables={"reviewId": str(review.id), "approve": True},
            context_value=ctx(users["admin"]),
        )
        assert result.data["resolveReviewHideRequest"]["success"] is False
        assert "pending" in result.data["resolveReviewHideRequest"]["errors"][0].lower()

    def test_non_admin_cannot_resolve(self, users, completed_session):
        review = Review.objects.create(
            mentor=users["mentor"], mentee=users["mentee"],
            remark="Mentor tries", score=1, hide_request_status=HideRequestStatus.PENDING,
        )
        result = schema.execute(
            RESOLVE_REVIEW_HIDE_REQUEST,
            variables={"reviewId": str(review.id), "approve": True},
            context_value=ctx(users["mentor"]),
        )
        assert result.data["resolveReviewHideRequest"]["success"] is False