import graphene
import graphql_jwt
from django.contrib.auth import authenticate
from .models import CustomUser, RoleChoices
from .types import UserType


class RegisterMutation(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        occupation = graphene.String(required=True)
        address = graphene.String()
        bio = graphene.String()

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, email, password, first_name, last_name, occupation,
               address="", bio=""):
        if not occupation.strip():
            return RegisterMutation(
                success=False,
                errors=["Occupation is required."],
            )
        if CustomUser.objects.filter(email=email).exists():
            return RegisterMutation(
                success=False,
                errors=["A user with this email already exists."]
            )
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            occupation=occupation.strip(),
            address=address,
            bio=bio,
            role=RoleChoices.USER,
        )
        return RegisterMutation(user=user, success=True, errors=[])


class LoginMutation(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, email, password):
        user = authenticate(info.context, username=email, password=password)
        if not user:
            return LoginMutation(
                success=False,
                errors=["Invalid credentials. Please check your email and password."]
            )
        token = graphql_jwt.shortcuts.get_token(user)
        return LoginMutation(token=token, user=user, success=True, errors=[])


class ToggleMentorStatusMutation(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, user_id):
        requesting_user = info.context.user
        if not requesting_user.is_authenticated:
            return ToggleMentorStatusMutation(success=False, errors=["Authentication required."])
        if requesting_user.role != RoleChoices.ADMIN:
            return ToggleMentorStatusMutation(success=False, errors=["Admin access required."])

        try:
            target_user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return ToggleMentorStatusMutation(success=False, errors=["User not found."])

        if target_user.role == RoleChoices.ADMIN:
            return ToggleMentorStatusMutation(success=False, errors=["Cannot change an admin's role."])

        if target_user.role == RoleChoices.MENTOR:
            target_user.role = RoleChoices.USER
        else:
            target_user.role = RoleChoices.MENTOR
        target_user.save()
        return ToggleMentorStatusMutation(user=target_user, success=True, errors=[])


class AddAdminMutation(graphene.Mutation):
    """Create a brand-new admin account from name + email + address.
    Password is hardcoded to Password123! (per spec)."""

    class Arguments:
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        address = graphene.String()

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    def mutate(self, info, first_name, last_name, email, address=""):
        requesting_user = info.context.user
        if not requesting_user.is_authenticated:
            return AddAdminMutation(success=False, errors=["Authentication required."])
        if requesting_user.role != RoleChoices.ADMIN:
            return AddAdminMutation(success=False, errors=["Admin access required."])

        if CustomUser.objects.filter(email=email).exists():
            return AddAdminMutation(
                success=False,
                errors=["A user with this email already exists."],
            )

        new_admin = CustomUser.objects.create_user(
            email=email,
            password="Password123!",
            first_name=first_name,
            last_name=last_name,
            address=address,
            role=RoleChoices.ADMIN,
            is_staff=True,
        )
        return AddAdminMutation(user=new_admin, success=True, errors=[])


class Query(graphene.ObjectType):
    all_mentors = graphene.List(UserType)
    mentor_detail = graphene.Field(UserType, id=graphene.ID(required=True))
    all_users = graphene.List(UserType)
    me = graphene.Field(UserType)

    def resolve_all_mentors(self, info):
        return CustomUser.objects.filter(role=RoleChoices.MENTOR)

    def resolve_mentor_detail(self, info, id):
        try:
            return CustomUser.objects.get(id=id, role=RoleChoices.MENTOR)
        except CustomUser.DoesNotExist:
            return None

    def resolve_all_users(self, info):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role != RoleChoices.ADMIN:
            raise Exception("Admin access required.")
        return CustomUser.objects.all()

    def resolve_me(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return None
        return user


class Mutation(graphene.ObjectType):
    register = RegisterMutation.Field()
    login = LoginMutation.Field()
    toggle_mentor_status = ToggleMentorStatusMutation.Field()
    add_admin = AddAdminMutation.Field()