import os
from pathlib import Path
from app.models.schemas import AIGenerateRequest
from app.models.enums import AIOperation
from app.config import settings

class PromptService:
    def __init__(self):
        self.prompts_dir = Path(__file__).parent.parent / "prompts"
        self.templates = {}
        self.load_templates()

    def load_templates(self):
        template_files = {
            "system": "system.txt",
            "review": "review.txt",
            "chat": "chat.txt",
            "explain": "explain.txt",
            "tests": "tests.txt",
        }
        for key, filename in template_files.items():
            filepath = self.prompts_dir / filename
            if filepath.exists():
                with open(filepath, "r", encoding="utf-8") as f:
                    self.templates[key] = f.read()
            else:
                raise FileNotFoundError(f"Prompt template missing: {filepath}")

    def build_prompts(self, request: AIGenerateRequest) -> tuple[str, str]:
        language = request.language or "typescript"
        code = request.code or "// No code provided"

        system_prompt = self.templates["system"].format(language=language)

        if request.operation == AIOperation.REVIEW:
            sel_start = request.selection.start_line if request.selection else 1
            sel_end = request.selection.end_line if request.selection else 1
            user_prompt = self.templates["review"].format(
                language=language,
                scope=request.scope or "full_file",
                selection_start=sel_start,
                selection_end=sel_end,
                code=code,
            )
        elif request.operation == AIOperation.CHAT:
            # Bound conversation history to MAX_CONVERSATION_MESSAGES
            history = request.conversation[-settings.MAX_CONVERSATION_MESSAGES:]
            conv_lines = []
            user_msg = "Hello"
            if history:
                user_msg = history[-1].content
                history = history[:-1]

            for msg in history:
                conv_lines.append(f"{msg.role.capitalize()}: {msg.content}")

            conv_text = "\n".join(conv_lines) if conv_lines else "None"

            user_prompt = self.templates["chat"].format(
                language=language,
                code=code,
                conversation_text=conv_text,
                user_message=user_msg,
            )
        elif request.operation == AIOperation.EXPLAIN:
            user_prompt = self.templates["explain"].format(
                language=language,
                code=code,
            )
        elif request.operation == AIOperation.GENERATE_TESTS:
            user_prompt = self.templates["tests"].format(
                language=language,
                code=code,
            )
        else:
            user_prompt = f"Analyze the following {language} code:\n\n{code}"

        return system_prompt, user_prompt

prompt_service = PromptService()
