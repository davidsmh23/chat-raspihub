from __future__ import annotations

from datetime import datetime
from pathlib import Path

MEMORY_FILE = Path("memory/agent_context.md")
MAX_CHARS = 8000


class MemoryService:
    def get_context(self) -> str:
        if not MEMORY_FILE.exists():
            return ""
        return MEMORY_FILE.read_text(encoding="utf-8")

    def append_session(self, summary: str) -> None:
        MEMORY_FILE.parent.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        entry = f"\n\n## Sesión {timestamp}\n{summary}"

        current = self.get_context()
        new_content = current + entry

        if len(new_content) > MAX_CHARS:
            new_content = self._compress(new_content)

        MEMORY_FILE.write_text(new_content, encoding="utf-8")

    def _compress(self, content: str) -> str:
        lines = content.split("\n")
        session_markers: list[int] = []
        for i, line in enumerate(lines):
            if line.startswith("## Sesión"):
                session_markers.append(i)

        if len(session_markers) <= 2:
            return content

        keep_from = session_markers[-2]
        header = "# RaspiHub Agent Memory\n_Comprimido automáticamente_\n"
        return header + "\n".join(lines[keep_from:])
