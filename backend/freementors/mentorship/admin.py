from django.contrib import admin
from .models import MentorshipSession, Review


@admin.register(MentorshipSession)
class MentorshipSessionAdmin(admin.ModelAdmin):
    list_display = ("mentee", "mentor", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("mentee__email", "mentor__email")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("mentee", "mentor", "score", "is_hidden")
    list_filter = ("is_hidden", "score")
    search_fields = ("mentee__email", "mentor__email")
