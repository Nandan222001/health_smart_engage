class WorkflowService:
    def start(self, workflow_key: str, context: dict) -> dict:
        return {"workflowKey": workflow_key, "status": "started", "context": context}

    def transition(self, workflow_key: str, transition_key: str, context: dict) -> dict:
        return {
            "workflowKey": workflow_key,
            "transition": transition_key,
            "status": "transitioned",
            "context": context,
        }
