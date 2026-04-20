import graphene
import graphql_jwt
from users.schema import Query as UserQuery, Mutation as UserMutation
from mentorship.schema import Query as MentorshipQuery, Mutation as MentorshipMutation


class Query(UserQuery, MentorshipQuery, graphene.ObjectType):
    pass


class Mutation(UserMutation, MentorshipMutation, graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
