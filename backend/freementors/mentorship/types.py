import graphene
from graphene_django import DjangoObjectType
from .models import MentorshipSession, Review


class SessionType(DjangoObjectType):
    class Meta:
        model = MentorshipSession
        fields = ("id", "mentee", "mentor", "questions", "status", "created_at")

    status = graphene.String()

    def resolve_status(self, info):
        return self.status


class ReviewType(DjangoObjectType):
    class Meta:
        model = Review
        fields = ("id", "mentor", "mentee", "remark", "score", "is_hidden")
