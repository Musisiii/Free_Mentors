import graphene
from users.models import CustomUser, RoleChoices
from .models import MentorshipSession, Review, SessionStatus
from .types import SessionType, ReviewType


class CreateSessionMutation(graphene.Mutation):
    class Arguments:
        mentor_id = graphene.ID(required=True)
        questions = graphene.String(required=True)

    session = graphene.Field(SessionType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, mentor_id, questions):
        user = info.context.user
        if not user.is_authenticated:
            return CreateSessionMutation(success=False, errors=["Authentication required."])

        try:
            mentor = CustomUser.objects.get(id=mentor_id, role=RoleChoices.MENTOR)
        except CustomUser.DoesNotExist:
            return CreateSessionMutation(success=False, errors=["Mentor not found."])

        if user.id == mentor.id:
            return CreateSessionMutation(success=False, errors=["You cannot request a session with yourself."])

        session = MentorshipSession.objects.create(
            mentee=user,
            mentor=mentor,
            questions=questions,
            status=SessionStatus.PENDING,
        )
        return CreateSessionMutation(session=session, success=True, errors=[])


class UpdateSessionStatusMutation(graphene.Mutation):
    class Arguments:
        session_id = graphene.ID(required=True)
        status = graphene.String(required=True)

    session = graphene.Field(SessionType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, session_id, status):
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
            status=SessionStatus.COMPLETED,
        ).exists()

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


class HideReviewMutation(graphene.Mutation):
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


class Query(graphene.ObjectType):
    my_sessions = graphene.List(SessionType)
    all_reviews = graphene.List(ReviewType)

    def resolve_my_sessions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        if user.role == RoleChoices.MENTOR:
            return MentorshipSession.objects.filter(mentor=user)
        else:
            return MentorshipSession.objects.filter(mentee=user)

    def resolve_all_reviews(self, info):
        return Review.objects.filter(is_hidden=False)


class Mutation(graphene.ObjectType):
    create_session = CreateSessionMutation.Field()
    update_session_status = UpdateSessionStatusMutation.Field()
    create_review = CreateReviewMutation.Field()
    hide_review = HideReviewMutation.Field()
