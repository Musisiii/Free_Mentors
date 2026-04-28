import graphene
from graphene_django import DjangoObjectType
from .models import MentorshipSession, Review, PromotionRequest


class SessionType(DjangoObjectType):
    class Meta:
        model = MentorshipSession
        fields = (
            "id",
            "mentee",
            "mentor",
            "questions",
            "status",
            "scheduled_at",
            "duration_minutes",
            "reject_reason",
            "created_at",
        )

    status = graphene.String()

    def resolve_status(self, info):
        return self.status


class ReviewType(DjangoObjectType):
    class Meta:
        model = Review
        fields = (
            "id",
            "mentor",
            "mentee",
            "remark",
            "score",
            "is_hidden",
            "hide_request_status",
        )

    hide_request_status = graphene.String()

    def resolve_hide_request_status(self, info):
        return self.hide_request_status


class PromotionRequestType(DjangoObjectType):
    class Meta:
        model = PromotionRequest
        fields = ("id", "user", "occupation", "expertise", "status", "created_at")

    status = graphene.String()

    def resolve_status(self, info):
        return self.status