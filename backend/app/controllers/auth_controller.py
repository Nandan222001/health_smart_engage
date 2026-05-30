from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.auth_service import AuthService


class AuthController:
    def __init__(self, service: AuthService):
        self.service = service

    def login(self, email: str, password: str) -> dict:
        result = self.service.login(email, password)
        return ok(result)

    def logout(self, user: CurrentUser) -> dict:
        return accepted({"user_id": user.user_id})

    def me(self, user: CurrentUser) -> dict:
        result = self.service.me(user)
        return ok(result)
