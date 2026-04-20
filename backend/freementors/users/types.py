import graphene
from graphene_django import DjangoObjectType
from .models import CustomUser


class UserType(DjangoObjectType):
    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "address",
            "bio",
            "occupation",
            "expertise",
            "role",
        )
    
    role = graphene.String()

    def resolve_role(self, info):
        return self.role
