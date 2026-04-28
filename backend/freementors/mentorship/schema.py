import graphene
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from users.models import CustomUser, RoleChoices
from .models import (
    MentorshipSession,
    Review,
    PromotionRequest,
    SessionStatus,
    HideRequestStatus,
    PromotionStatus,
)
from .types import SessionType, ReviewType, PromotionRequestType


DEFAULT_AUTO_REJECT_REASON = (
    "mentor couldn't accept the session before the requested time"
)


def _auto_reject_expired_pending(qs):
    """Mark any PENDING sessions whose scheduled_at is in the past as REJECTED."""
    now = timezone.now()
    expired = qs.filter(
        status=SessionStatus.PENDING,
        scheduled_at__isnull=False,
        scheduled_at__lt=now,
    )
    for s in expired:
        s.status = SessionStatus.REJECTED
        if not s.reject_reason:
            s.reject_reason = DEFAULT_AUTO_REJECT_REASON
        s.save()


def _has_session_conflict(mentor, scheduled_at, duration_minutes, exclude_id=None):
    """A conflict exists if any PENDING/ACCEPTED session of this mentor overlaps
    the requested window [scheduled_at, scheduled_at + duration)."""
    if scheduled_at is None:
        return False
    new_end = scheduled_at + timedelta(minutes=duration_minutes)
    qs = MentorshipSession.objects.filter(
        mentor=mentor,
        status__in=[SessionStatus.PENDING, SessionStatus.ACCEPTED],
        scheduled_at__isnull=False,
    )
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    for s in qs:
        existing_end = s.scheduled_at + timedelta(minutes=s.duration_minutes or 30)
        # overlap if start < other_end and end > other_start
        if scheduled_at < existing_end and new_end > s.scheduled_at:
            return True
    return False


class CreateSessionMutation(graphene.Mutation):
    class Arguments:
        mentor_id = graphene.ID(required=True)
        questions = graphene.String(required=True)
        scheduled_at = graphene.DateTime(required=True)
        duration_minutes = graphene.Int(required=True)

    session = graphene.Field(SessionType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, mentor_id, questions, scheduled_at, duration_minutes):
        user = info.context.user
        if not user.is_authenticated:
            return CreateSessionMutation(success=False, errors=["Authentication required."])

        try:
            mentor = CustomUser.objects.get(id=mentor_id, role=RoleChoices.MENTOR)
        except CustomUser.DoesNotExist:
            return CreateSessionMutation(success=False, errors=["Mentor not found."])

        if user.id == mentor.id:
            return CreateSessionMutation(success=False, errors=["You cannot request a session with yourself."])

        if duration_minutes <= 0:
            return CreateSessionMutation(success=False, errors=["Duration must be a positive number of minutes."])

        now = timezone.now()
        min_start = now + timedelta(minutes=10)
        if scheduled_at < min_start:
            return CreateSessionMutation(
                success=False,
                errors=["Scheduled time must be at least 10 minutes in the future."],
            )

        if _has_session_conflict(mentor, scheduled_at, duration_minutes):
            return CreateSessionMutation(
                success=False,
                errors=["This mentor already has another session scheduled in that time slot."],
            )

        session = MentorshipSession.objects.create(
            mentee=user,
            mentor=mentor,
            questions=questions,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            status=SessionStatus.PENDING,
        )
        return CreateSessionMutation(session=session, success=True, errors=[])


class UpdateSessionStatusMutation(graphene.Mutation):
    class Arguments:
        session_id = graphene.ID(required=True)
        status = graphene.String(required=True)
        reject_reason = graphene.String()

    session = graphene.Field(SessionType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, session_id, status, reject_reason=""):
        user = info.context.user
        if not user.is_authenticated:
            return UpdateSessionStatusMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.MENTOR:
            return UpdateSessionStatusMutation(success=False, errors=["Only mentors can update session status."])

        valid_statuses = [SessionStatus.ACCEPTED, SessionStatus.REJECTED, SessionStatus.COMPLETED]
        if status not in [s.value for s in valid_statuses]:
            return UpdateSessionStatusMutation(
                success=False,
                errors=[f"Invalid status. Allowed: ACCEPTED, REJECTED, COMPLETED."]
            )

        try:
            session = MentorshipSession.objects.get(id=session_id)
        except MentorshipSession.DoesNotExist:
            return UpdateSessionStatusMutation(success=False, errors=["Session not found."])

        if session.mentor.id != user.id:
            return UpdateSessionStatusMutation(
                success=False,
                errors=["You can only update sessions assigned to you."]
            )

        session.status = status
        if status == SessionStatus.REJECTED:
            session.reject_reason = (reject_reason or "").strip() or "No reason provided."
        session.save()
        return UpdateSessionStatusMutation(session=session, success=True, errors=[])


class CreateReviewMutation(graphene.Mutation):
    class Arguments:
        mentor_id = graphene.ID(required=True)
        remark = graphene.String(required=True)
        score = graphene.Int(required=True)

    review = graphene.Field(ReviewType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, mentor_id, remark, score):
        try:
            user = info.context.user
            if not user.is_authenticated:
                return CreateReviewMutation(success=False, errors=["Authentication required."])

            if not 1 <= score <= 5:
                return CreateReviewMutation(success=False, errors=["Score must be between 1 and 5."])

            try:
                mentor = CustomUser.objects.get(id=mentor_id, role=RoleChoices.MENTOR)
            except CustomUser.DoesNotExist:
                return CreateReviewMutation(success=False, errors=["Mentor not found."])

            has_completed_session = MentorshipSession.objects.filter(
                mentee=user,
                mentor=mentor,
                status=SessionStatus.COMPLETED.value,
            ).count() > 0

            if not has_completed_session:
                return CreateReviewMutation(
                    success=False,
                    errors=["You can only review a mentor after completing a session with them."]
                )

            review = Review.objects.create(
                mentor=mentor,
                mentee=user,
                remark=remark,
                score=score,
            )
            return CreateReviewMutation(review=review, success=True, errors=[])
        except Exception as e:
            import traceback
            print(f"CreateReviewMutation error: {str(e)}")
            traceback.print_exc()
            return CreateReviewMutation(success=False, errors=[f"Error creating review: {str(e)}"])


class HideReviewMutation(graphene.Mutation):
    """Admin direct toggle of a review's visibility."""

    class Arguments:
        review_id = graphene.ID(required=True)

    review = graphene.Field(ReviewType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, review_id):
        user = info.context.user
        if not user.is_authenticated:
            return HideReviewMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.ADMIN:
            return HideReviewMutation(success=False, errors=["Admin access required."])

        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return HideReviewMutation(success=False, errors=["Review not found."])

        review.is_hidden = not review.is_hidden
        review.save()
        return HideReviewMutation(review=review, success=True, errors=[])


class RequestReviewHideMutation(graphene.Mutation):
    """Mentor flags one of their own reviews for admin review."""

    class Arguments:
        review_id = graphene.ID(required=True)

    review = graphene.Field(ReviewType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, review_id):
        user = info.context.user
        if not user.is_authenticated:
            return RequestReviewHideMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.MENTOR:
            return RequestReviewHideMutation(success=False, errors=["Only mentors can request review hides."])

        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return RequestReviewHideMutation(success=False, errors=["Review not found."])

        if review.mentor.id != user.id:
            return RequestReviewHideMutation(
                success=False,
                errors=["You can only request hides for reviews about yourself."],
            )

        if review.hide_request_status == HideRequestStatus.PENDING:
            return RequestReviewHideMutation(
                success=False,
                errors=["A hide request for this review is already pending."],
            )
        if review.hide_request_status == HideRequestStatus.APPROVED or review.is_hidden:
            return RequestReviewHideMutation(
                success=False,
                errors=["This review is already hidden."],
            )

        review.hide_request_status = HideRequestStatus.PENDING
        review.save()
        return RequestReviewHideMutation(review=review, success=True, errors=[])


class ResolveReviewHideRequestMutation(graphene.Mutation):
    """Admin approves or rejects a mentor's hide request."""

    class Arguments:
        review_id = graphene.ID(required=True)
        approve = graphene.Boolean(required=True)

    review = graphene.Field(ReviewType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, review_id, approve):
        user = info.context.user
        if not user.is_authenticated:
            return ResolveReviewHideRequestMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.ADMIN:
            return ResolveReviewHideRequestMutation(success=False, errors=["Admin access required."])

        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return ResolveReviewHideRequestMutation(success=False, errors=["Review not found."])

        if review.hide_request_status != HideRequestStatus.PENDING:
            return ResolveReviewHideRequestMutation(
                success=False,
                errors=["No pending hide request on this review."],
            )

        if approve:
            review.hide_request_status = HideRequestStatus.APPROVED
            review.is_hidden = True
        else:
            review.hide_request_status = HideRequestStatus.REJECTED
        review.save()
        return ResolveReviewHideRequestMutation(review=review, success=True, errors=[])


class CreatePromotionRequestMutation(graphene.Mutation):
    """User asks to be promoted to mentor."""

    class Arguments:
        occupation = graphene.String(required=True)
        expertise = graphene.String(required=True)

    request = graphene.Field(PromotionRequestType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, occupation, expertise):
        user = info.context.user
        if not user.is_authenticated:
            return CreatePromotionRequestMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.USER:
            return CreatePromotionRequestMutation(
                success=False,
                errors=["Only regular users can request promotion to mentor."],
            )
        if not expertise.strip():
            return CreatePromotionRequestMutation(success=False, errors=["Expertise is required."])
        if not occupation.strip():
            return CreatePromotionRequestMutation(success=False, errors=["Occupation is required."])

        existing = PromotionRequest.objects.filter(
            user=user, status=PromotionStatus.PENDING
        ).first()
        if existing:
            return CreatePromotionRequestMutation(
                success=False,
                errors=["You already have a pending promotion request."],
            )

        req = PromotionRequest.objects.create(
            user=user,
            occupation=occupation.strip(),
            expertise=expertise.strip(),
            status=PromotionStatus.PENDING,
        )
        return CreatePromotionRequestMutation(request=req, success=True, errors=[])


class ResolvePromotionRequestMutation(graphene.Mutation):
    """Admin approves or rejects a promotion request."""

    class Arguments:
        request_id = graphene.ID(required=True)
        approve = graphene.Boolean(required=True)

    request = graphene.Field(PromotionRequestType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, request_id, approve):
        user = info.context.user
        if not user.is_authenticated:
            return ResolvePromotionRequestMutation(success=False, errors=["Authentication required."])
        if user.role != RoleChoices.ADMIN:
            return ResolvePromotionRequestMutation(success=False, errors=["Admin access required."])

        try:
            req = PromotionRequest.objects.get(id=request_id)
        except PromotionRequest.DoesNotExist:
            return ResolvePromotionRequestMutation(success=False, errors=["Request not found."])

        if req.status != PromotionStatus.PENDING:
            return ResolvePromotionRequestMutation(
                success=False,
                errors=["This request has already been resolved."],
            )

        if approve:
            req.status = PromotionStatus.APPROVED
            target = req.user
            target.role = RoleChoices.MENTOR
            target.occupation = req.occupation
            target.expertise = req.expertise
            target.save()
        else:
            req.status = PromotionStatus.REJECTED
        req.save()
        return ResolvePromotionRequestMutation(request=req, success=True, errors=[])


class Query(graphene.ObjectType):
    my_sessions = graphene.List(SessionType)
    all_reviews = graphene.List(ReviewType)
    my_promotion_request = graphene.Field(PromotionRequestType)
    all_promotion_requests = graphene.List(PromotionRequestType)
    pending_hide_requests = graphene.List(ReviewType)

    def resolve_my_sessions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        if user.role == RoleChoices.MENTOR:
            qs = MentorshipSession.objects.filter(mentor=user)
        else:
            qs = MentorshipSession.objects.filter(mentee=user)

        # Lazy auto-reject expired pending sessions before returning the list.
        _auto_reject_expired_pending(qs)
        if user.role == RoleChoices.MENTOR:
            return MentorshipSession.objects.filter(mentor=user)
        return MentorshipSession.objects.filter(mentee=user)

    def resolve_all_reviews(self, info):
        user = info.context.user
        # Admin sees everything (for moderation).
        if user.is_authenticated and user.role == RoleChoices.ADMIN:
            return Review.objects.all()
        # Authenticated mentors and mentees still see hidden reviews tied to
        # them (their own written reviews and reviews about them) so the
        # mentor can manage hide requests and the mentee can see their own
        # history. Everyone else only sees visible reviews.
        if user.is_authenticated:
            return Review.objects.filter(
                Q(is_hidden=False) | Q(mentor_id=user.id) | Q(mentee_id=user.id)
            )
        return Review.objects.filter(is_hidden=False)

    def resolve_my_promotion_request(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return None
        return (
            PromotionRequest.objects.filter(user=user)
            .order_by("-created_at")
            .first()
        )

    def resolve_all_promotion_requests(self, info):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role != RoleChoices.ADMIN:
            raise Exception("Admin access required.")
        return PromotionRequest.objects.all()

    def resolve_pending_hide_requests(self, info):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role != RoleChoices.ADMIN:
            raise Exception("Admin access required.")
        return Review.objects.filter(hide_request_status=HideRequestStatus.PENDING)


class Mutation(graphene.ObjectType):
    create_session = CreateSessionMutation.Field()
    update_session_status = UpdateSessionStatusMutation.Field()
    create_review = CreateReviewMutation.Field()
    hide_review = HideReviewMutation.Field()
    request_review_hide = RequestReviewHideMutation.Field()
    resolve_review_hide_request = ResolveReviewHideRequestMutation.Field()
    create_promotion_request = CreatePromotionRequestMutation.Field()
    resolve_promotion_request = ResolvePromotionRequestMutation.Field()