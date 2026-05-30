from app.core.security import CurrentUser
from app.helpers.response import accepted, ok
from app.services.learning_service import LearningService


class LearningController:
    def __init__(self, service: LearningService):
        self.service = service

    def get_learning_loop_data(self, user: CurrentUser) -> dict:
        result = self.service.get_learning_loop_data(user)
        return ok(result)

    def list_operational_events(self, user: CurrentUser) -> dict:
        result = self.service.list_operational_events(user)
        return ok(result)

    def list_patterns(self, user: CurrentUser) -> dict:
        result = self.service.list_patterns(user)
        return ok(result)

    def list_models(self, user: CurrentUser) -> dict:
        result = self.service.list_models(user)
        return ok(result)

    def trigger_training(self, user: CurrentUser, model_id: str, payload: dict) -> dict:
        result = self.service.trigger_training(user, model_id, payload)
        return accepted(result)

    def promote_model_version(self, user: CurrentUser, model_id: str, version_id: str, payload: dict) -> dict:
        result = self.service.promote_model_version(user, model_id, version_id, payload)
        return accepted(result)

    def get_safety_outcomes(self, user: CurrentUser) -> dict:
        result = self.service.get_safety_outcomes(user)
        return ok(result)
