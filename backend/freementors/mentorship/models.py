from django.db import models
from django.conf import settings


class SessionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"
    COMPLETED = "COMPLETED", "Completed"


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

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"Review by {self.mentee.email} for {self.mentor.email} (Score: {self.score})"
