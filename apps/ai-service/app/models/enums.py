from enum import Enum

class AIOperation(str, Enum):
    REVIEW = "review"
    CHAT = "chat"
    EXPLAIN = "explain"
    GENERATE_TESTS = "generate_tests"

class Severity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
