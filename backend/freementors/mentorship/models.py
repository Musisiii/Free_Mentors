from django.db import models
from django.conf import settings


class SessionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"
    COMPLETED = "COMPLETED", "Completed"


class HideRequestStatus(models.TextChoices):
    NONE = "NONE", "None"
    PENDING = "PENDING", "Pending"


class PromotionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class MentorshipSession(models.Model):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions_as_mentee",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions_as_mentor",
    )
    questions = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=SessionStatus.choices,
        default=SessionStatus.PENDING,
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=30)
    reject_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Mentorship Session"
        verbose_name_plural = "Mentorship Sessions"

    def __str__(self):
        return f"Session: {self.mentee.email} -> {self.mentor.email} [{self.status}]"


class Review(models.Model):
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_received",
    )
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )
    remark = models.TextField()
    score = models.IntegerField()
    is_hidden = models.BooleanField(default=False)
    hide_request_status = models.CharField(
        max_length=10,
        choices=HideRequestStatus.choices,
        default=HideRequestStatus.NONE,
    )

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"Review by {self.mentee.email} for {self.mentor.email} (Score: {self.score})"


class PromotionRequest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="promotion_requests",
    )
    occupation = models.CharField(max_length=150)
    expertise = models.CharField(max_length=150)
    status = models.CharField(
        max_length=10,
        choices=PromotionStatus.choices,
        default=PromotionStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Promotion Request"
        verbose_name_plural = "Promotion Requests"

    def __str__(self):
        return f"Promotion: {self.user.email} [{self.status}]"