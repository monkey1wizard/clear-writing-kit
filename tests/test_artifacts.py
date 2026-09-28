import contextlib
import importlib
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from artifacts import CORE, WEB_SKILL, render_claude, render_web

import importlib.util
spec = importlib.util.spec_from_file_location("web_generator", ROOT / "scripts/generate-web-artifacts.py")
web_generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(web_generator)

style_spec = importlib.util.spec_from_file_location("style_generator", ROOT / "scripts/generate-output-style.py")
style_generator = importlib.util.module_from_spec(style_spec)
style_spec.loader.exec_module(style_generator)


class Artifacts(unittest.TestCase):
    def test_repository_branding_preserves_distinct_skill_names(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertTrue(readme.startswith("# clear-writing-kit\n\nWriting rules, skills, and checks for en-US, zh-TW, and ja-JP.\n"))
        package = json.loads((ROOT / "writing/package.json").read_text(encoding="utf-8"))
        lock = json.loads((ROOT / "writing/package-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(package["name"], "clear-writing-kit-checks")
        self.assertEqual(lock["name"], package["name"])
        self.assertEqual(lock["packages"][""]["name"], package["name"])
        core = (ROOT / CORE / "SKILL.md").read_text(encoding="utf-8")
        outputs = render_web()
        self.assertIn("\nname: coding-agent-writing\n", core)
        self.assertIn("\nname: web-answer-writing\n", outputs[WEB_SKILL / "SKILL.md"])
        for text in (core, outputs[WEB_SKILL / "SKILL.md"]):
            self.assertIn("toolkit: clear-writing-kit", text)
        for text in (*outputs.values(), render_claude()):
            self.assertNotIn("accurate-answer", text)

    def test_default_style_name_changes_without_deleting_existing_style(self):
        self.assertEqual(style_generator.DEFAULT_OUTPUT.name, "clear-writing-kit.md")
        self.assertEqual(style_generator.DEFAULT_OUTPUT.parent.name, "output-styles")
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stdout(io.StringIO()):
            root = Path(d)
            old = root / "accurate-answer.md"
            old.write_text("existing user style", encoding="utf-8")
            target = root / style_generator.DEFAULT_OUTPUT.name
            with patch.object(style_generator, "DEFAULT_OUTPUT", target):
                with patch.object(sys, "argv", ["generate-output-style.py"]):
                    self.assertEqual(style_generator.main(), 0)
                with patch.object(sys, "argv", ["generate-output-style.py", "--check"]):
                    self.assertEqual(style_generator.main(), 0)
            self.assertIn("\nname: clear-writing-kit\n", target.read_text(encoding="utf-8"))
            self.assertEqual(old.read_text(encoding="utf-8"), "existing user style")

    def test_default_web_preview_uses_new_name(self):
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stdout(io.StringIO()):
            with patch.object(web_generator.tempfile, "mkdtemp", return_value=d) as make_temp:
                with patch.object(sys, "argv", ["generate-web-artifacts.py"]):
                    self.assertEqual(web_generator.main(), 0)
                make_temp.assert_called_once_with(prefix="clear-writing-kit-web-")
            self.assertTrue(web_generator.check(Path(d), render_web()))

    def test_web_scope_and_self_contained_links(self):
        outputs = render_web()
        self.assertEqual(len(outputs), 7)
        self.assertTrue(all(str(p).startswith(("web-skills", "web-instructions")) for p in outputs))
        for relative, text in outputs.items():
            for target in re.findall(r"\]\(([^)]+)\)", text):
                if not target.startswith(("https:", "#")):
                    resolved = Path(relative.parent, target)
                    self.assertIn(resolved, outputs)
        self.assertFalse(any("local-checks" in str(p) or "zhtw-checks" in str(p) for p in outputs))

    def test_shared_source_change_propagates(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            shutil.copytree(ROOT / CORE, root / CORE)
            shutil.copytree(ROOT / "scripts/templates", root / "scripts/templates")
            before = render_web(root)
            source = root / CORE / "references/accuracy.md"
            source.write_text(source.read_text(encoding="utf-8").replace("Lead with the answer.", "Lead with the verified answer."), encoding="utf-8")
            after = render_web(root)
            for name in ("chatgpt", "gemini"):
                self.assertIn("Lead with the verified answer.", after[Path("web-instructions") / (name + ".md")])
            self.assertNotEqual(before[WEB_SKILL / "references/accuracy.md"], after[WEB_SKILL / "references/accuracy.md"])
            self.assertIn("Lead with the verified answer.", render_claude(root))

    def test_check_detects_missing_stale_and_extra_files(self):
        outputs = render_web()
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stderr(io.StringIO()):
            root = Path(d)
            self.assertFalse(web_generator.check(root, outputs))
            for p, text in outputs.items():
                (root / p).parent.mkdir(parents=True, exist_ok=True)
                (root / p).write_text(text, encoding="utf-8")
            self.assertTrue(web_generator.check(root, outputs))
            (root / WEB_SKILL / "SKILL.md").write_text("stale", encoding="utf-8")
            self.assertFalse(web_generator.check(root, outputs))
            (root / WEB_SKILL / "SKILL.md").write_text(outputs[WEB_SKILL / "SKILL.md"], encoding="utf-8")
            (root / WEB_SKILL / "extra.md").write_text("extra", encoding="utf-8")
            self.assertFalse(web_generator.check(root, outputs))

    def test_archive_members_and_deterministic_content(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            args = [sys.executable, str(ROOT / "scripts/generate-web-artifacts.py"), "--output-dir", str(root / "out"), "--archive-dir", str(root / "zip")]
            subprocess.run(args, check=True, capture_output=True)
            with zipfile.ZipFile(root / "zip/web-answer-writing.zip") as archive:
                expected = {p.relative_to(WEB_SKILL).as_posix(): t for p, t in render_web().items() if p.is_relative_to(WEB_SKILL)}
                self.assertEqual(set(archive.namelist()), set(expected))
                for p, t in expected.items():
                    self.assertEqual(archive.read(p).decode("utf-8"), t)
            self.assertEqual(render_web(), render_web())

    def test_claude_embeds_local_procedures_without_file_links(self):
        text = render_claude()
        self.assertIn("工具可用時，必須在交付前執行檢查", text)
        self.assertIn("## Embedded ja-JP", text)
        self.assertNotRegex(text, r"\]\((?:references/)?[^)]+\.md\)")
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "style.md"
            cmd = [sys.executable, str(ROOT / "scripts/generate-output-style.py"), "--output", str(target)]
            self.assertNotEqual(subprocess.run(cmd + ["--check"], capture_output=True).returncode, 0)
            subprocess.run(cmd, check=True, capture_output=True)
            subprocess.run(cmd + ["--check"], check=True, capture_output=True)
            target.write_text("stale", encoding="utf-8")
            self.assertNotEqual(subprocess.run(cmd + ["--check"], capture_output=True).returncode, 0)

    def test_user_gemini_requirements_and_compact_limit(self):
        outputs = render_web()
        text = outputs[Path("web-instructions/gemini.md")]
        self.assertIn("Must check the date of today then search for the latest data to answer me.", text)
        self.assertIn("Do not proactively ask follow-up questions.", text)
        self.assertIn("Always reply in Traditional Chinese when I ask in Chinese.", text)
        self.assertIn("Never use `;` or `；`", text)
        block = outputs[Path("web-instructions/chatgpt.md")].split("```text\n")[1].split("\n```")[0]
        self.assertLessEqual(len(block), 1500)
        for platform in ("chatgpt", "gemini"):
            instructions = outputs[Path("web-instructions") / (platform + ".md")]
            self.assertIn("Use en-US spelling.", instructions)
            self.assertIn("For ja-JP documents, use plain forms", instructions)
            self.assertIn("Apply document style to documents drafted in chat.", instructions)
            self.assertIn("For ja-JP conversations, use polite text and lists.", instructions)

    def test_readme_languages_have_equal_commands_and_local_links(self):
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        sections = re.split(r"^## (?:English|繁體中文|日本語)\n", text, flags=re.M)[1:]
        self.assertEqual(len(sections), 3)
        commands = [re.findall(r"```powershell\n(.*?)```", section, re.S) for section in sections]
        self.assertEqual(commands[0], commands[1])
        self.assertEqual(commands[0], commands[2])
        links = [{p for p in re.findall(r"\]\(([^)]+)\)", section) if not p.startswith(("https:", "#"))} for section in sections]
        self.assertEqual(links[0], links[1])
        self.assertEqual(links[0], links[2])
        for target in links[0]:
            self.assertTrue((ROOT / target).is_file(), target)


if __name__ == "__main__":
    unittest.main()
