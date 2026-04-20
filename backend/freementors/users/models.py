from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class RoleChoices(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    MENTOR = "MENTOR", "Mentor"
    USER = "USER", "User"


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", RoleChoices.USER)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", RoleChoices.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    
    objects = CustomUserManager()
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    address = models.CharField(max_length=255, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    occupation = models.CharField(max_length=150, blank=True, default="")
    expertise = models.CharField(max_length=150, blank=True, default="")
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.USER,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.role})"
