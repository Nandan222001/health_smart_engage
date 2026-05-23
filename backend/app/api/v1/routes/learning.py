from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET",  "/learning/loop",             "learning_loop_summary",    "Continuous learning loop summary"),
    ("GET",  "/learning/events",           "learning_events_list",     "List operational events"),
    ("GET",  "/learning/patterns",         "learning_patterns_list",   "List detected patterns"),
    ("GET",  "/learning/models",           "learning_models_list",     "List ML models"),
    ("POST", "/learning/models/train",     "learning_models_train",    "Trigger model training"),
    ("POST", "/learning/models/promote",   "learning_models_promote",  "Promote model version"),
    ("GET",  "/learning/outcomes",         "learning_outcomes_list",   "Safety outcomes"),
]

register_catalog_routes(router, "web", ENDPOINTS)
