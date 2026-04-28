"""
Seed the database with test data for Free Mentors.

Usage:
    python manage.py seed_db
    python manage.py seed_db --clear   (clears existing data first)
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from users.models import CustomUser, RoleChoices
from mentorship.models import (
    MentorshipSession,
    Review,
    PromotionRequest,
    SessionStatus,
    HideRequestStatus,
    PromotionStatus,
)

SEED_PASSWORD = "Password123!"


def _safe_get_or_create_session(*, mentee, mentor, defaults):
    qs = MentorshipSession.objects.filter(mentee=mentee, mentor=mentor)
    existing = qs.first()
    if existing is not None:
        return existing, False
    return MentorshipSession.objects.create(
        mentee=mentee, mentor=mentor, **defaults
    ), True


def _safe_get_or_create_review(*, mentee, mentor, defaults):
    existing = Review.objects.filter(mentee=mentee, mentor=mentor).first()
    if existing is not None:
        return existing, False
    return Review.objects.create(
        mentee=mentee, mentor=mentor, **defaults
    ), True


class Command(BaseCommand):
    help = "Seed the database with test data for Free Mentors"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            Review.objects.all().delete()
            MentorshipSession.objects.all().delete()
            PromotionRequest.objects.all().delete()
            CustomUser.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing data cleared."))

        with transaction.atomic():
            self.stdout.write("Creating users...")

            admin, created = CustomUser.objects.get_or_create(
                email="admin@freementors.com",
                defaults={
                    "first_name": "Admin",
                    "last_name": "User",
                    "role": RoleChoices.ADMIN,
                    "is_staff": True,
                    "is_superuser": True,
                    "occupation": "Platform Administrator",
                    "bio": "Platform administrator for Free Mentors.",
                }
            )
            if created:
                admin.set_password(SEED_PASSWORD)
                admin.save()
                self.stdout.write(f"  Created admin: {admin.email}")
            else:
                self.stdout.write(f"  Admin already exists: {admin.email}")

            mentors_data = [
                {
                    "email": "mentor1.free@freementors.com",
                    "first_name": "Alice",
                    "last_name": "Johnson",
                    "expertise": "Tech",
                    "occupation": "Senior Software Engineer",
                    "bio": "10 years in software engineering, specializing in Python and distributed systems.",
                    "address": "San Francisco, CA",
                },
                {
                    "email": "mentor2.free@freementors.com",
                    "first_name": "Bob",
                    "last_name": "Martinez",
                    "expertise": "Finance",
                    "occupation": "Investment Banker",
                    "bio": "Expert in personal finance, investment strategies, and wealth management.",
                    "address": "New York, NY",
                },
                {
                    "email": "mentor3.free@freementors.com",
                    "first_name": "Carol",
                    "last_name": "Williams",
                    "expertise": "Health",
                    "occupation": "Registered Dietitian",
                    "bio": "Certified nutritionist with 8 years helping clients achieve their health goals.",
                    "address": "Chicago, IL",
                },
            ]

            mentors = []
            for data in mentors_data:
                mentor, created = CustomUser.objects.get_or_create(
                    email=data["email"],
                    defaults={**data, "role": RoleChoices.MENTOR}
                )
                if created:
                    mentor.set_password(SEED_PASSWORD)
                    mentor.save()
                    self.stdout.write(f"  Created mentor: {mentor.email}")
                else:
                    self.stdout.write(f"  Mentor already exists: {mentor.email}")
                mentors.append(mentor)

            users_data = [
                {
                    "email": "user1.free@freementors.com",
                    "first_name": "David",
                    "last_name": "Brown",
                    "occupation": "Junior Developer",
                    "bio": "Fresh graduate looking for career guidance in tech.",
                    "address": "Austin, TX",
                },
                {
                    "email": "user2.free@freementors.com",
                    "first_name": "Emma",
                    "last_name": "Davis",
                    "occupation": "Marketing Specialist",
                    "bio": "Exploring a career change into the tech industry.",
                    "address": "Seattle, WA",
                },
                {
                    "email": "user3.free@freementors.com",
                    "first_name": "Frank",
                    "last_name": "Wilson",
                    "occupation": "Accountant",
                    "bio": "Looking to improve my investment portfolio management.",
                    "address": "Boston, MA",
                },
                {
                    "email": "user4.free@freementors.com",
                    "first_name": "Grace",
                    "last_name": "Taylor",
                    "occupation": "Teacher",
                    "bio": "Interested in health and nutrition guidance for better lifestyle.",
                    "address": "Denver, CO",
                },
                {
                    "email": "user5.free@freementors.com",
                    "first_name": "Henry",
                    "last_name": "Anderson",
                    "occupation": "Freelance Designer",
                    "bio": "Self-employed creative looking for financial planning advice.",
                    "address": "Portland, OR",
                },
            ]

            mentees = []
            for data in users_data:
                mentee, created = CustomUser.objects.get_or_create(
                    email=data["email"],
                    defaults={**data, "role": RoleChoices.USER}
                )
                if created:
                    mentee.set_password(SEED_PASSWORD)
                    mentee.save()
                    self.stdout.write(f"  Created user: {mentee.email}")
                else:
                    self.stdout.write(f"  User already exists: {mentee.email}")
                mentees.append(mentee)

            self.stdout.write("Creating mentorship sessions...")

            tech_mentor = mentors[0]
            finance_mentor = mentors[1]
            health_mentor = mentors[2]
            now = timezone.now()

            # 2 PENDING sessions (in the future, non-conflicting)
            _safe_get_or_create_session(
                mentee=mentees[0],
                mentor=tech_mentor,
                defaults={
                    "questions": "I want to transition into backend development. What technologies should I focus on first? How long does it typically take to become job-ready?",
                    "status": SessionStatus.PENDING,
                    "scheduled_at": now + timedelta(days=2, hours=3),
                    "duration_minutes": 30,
                }
            )

            _safe_get_or_create_session(
                mentee=mentees[1],
                mentor=tech_mentor,
                defaults={
                    "questions": "I have a background in marketing. How can I leverage my skills in a product management role in tech companies?",
                    "status": SessionStatus.PENDING,
                    "scheduled_at": now + timedelta(days=3, hours=5),
                    "duration_minutes": 45,
                }
            )

            # 2 ACCEPTED sessions
            _safe_get_or_create_session(
                mentee=mentees[2],
                mentor=finance_mentor,
                defaults={
                    "questions": "I have $10k to invest. How should I approach building a diversified investment portfolio as a beginner?",
                    "status": SessionStatus.ACCEPTED,
                    "scheduled_at": now + timedelta(days=1, hours=2),
                    "duration_minutes": 60,
                }
            )

            _safe_get_or_create_session(
                mentee=mentees[3],
                mentor=health_mentor,
                defaults={
                    "questions": "I want to improve my diet and energy levels. Can you help me create a personalized nutrition plan?",
                    "status": SessionStatus.ACCEPTED,
                    "scheduled_at": now + timedelta(days=4, hours=1),
                    "duration_minutes": 30,
                }
            )

            # 1 REJECTED session with a reason
            _safe_get_or_create_session(
                mentee=mentees[4],
                mentor=finance_mentor,
                defaults={
                    "questions": "I need help with tax planning for my freelance income and understanding quarterly payments.",
                    "status": SessionStatus.REJECTED,
                    "scheduled_at": now + timedelta(days=5),
                    "duration_minutes": 30,
                    "reject_reason": "I'm not the best fit for tax-specific questions; consider an accountant.",
                }
            )

            # 2 COMPLETED sessions for review seeding
            _safe_get_or_create_session(
                mentee=mentees[0],
                mentor=finance_mentor,
                defaults={
                    "questions": "How do I start building savings as a junior developer with student debt?",
                    "status": SessionStatus.COMPLETED,
                    "scheduled_at": now - timedelta(days=10),
                    "duration_minutes": 30,
                }
            )

            _safe_get_or_create_session(
                mentee=mentees[3],
                mentor=tech_mentor,
                defaults={
                    "questions": "What programming language should I learn first as an absolute beginner?",
                    "status": SessionStatus.COMPLETED,
                    "scheduled_at": now - timedelta(days=14),
                    "duration_minutes": 45,
                }
            )

            self.stdout.write("Creating reviews...")

            _safe_get_or_create_review(
                mentee=mentees[0],
                mentor=finance_mentor,
                defaults={
                    "remark": "Bob was incredibly helpful and gave me practical advice on budgeting with student loans. Highly recommend!",
                    "score": 5,
                    "is_hidden": False,
                    "hide_request_status": HideRequestStatus.NONE,
                }
            )

            _safe_get_or_create_review(
                mentee=mentees[3],
                mentor=tech_mentor,
                defaults={
                    "remark": "Alice explained programming concepts very clearly and helped me pick Python as my first language. Great session!",
                    "score": 4,
                    "is_hidden": False,
                    "hide_request_status": HideRequestStatus.NONE,
                }
            )

            _safe_get_or_create_review(
                mentee=mentees[1],
                mentor=tech_mentor,
                defaults={
                    "remark": "This review has been hidden by an admin for violating community guidelines.",
                    "score": 1,
                    "is_hidden": True,
                    "hide_request_status": HideRequestStatus.APPROVED,
                }
            )

        self.stdout.write(self.style.SUCCESS("\nDatabase seeded successfully!"))
        self.stdout.write("\nAccount credentials (password for all: Password123!):")
        self.stdout.write("  Admin:   admin@freementors.com")
        self.stdout.write("  Mentors: mentor1.free@freementors.com, mentor2.free@freementors.com, mentor3.free@freementors.com")
        self.stdout.write("  Users:   user1.free@freementors.com ... user5.free@freementors.com")