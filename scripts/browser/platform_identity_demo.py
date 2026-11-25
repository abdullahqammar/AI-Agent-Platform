"""Run after npm run build. Uses only a new disposable loopback PostgreSQL container."""
import os
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SETTINGS = "/admin/settings/site-identity"


def check_browser(base, query):
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for width, height in [(1440, 900), (390, 844)]:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            page.goto(base + SETTINGS)
            expect(page.get_by_text("404", exact=True)).to_be_visible()
            email = f"identity-{secrets.token_hex(8)}@example.test"
            page.goto(base + "/register")
            for field, value in [("name", "Test operator"), ("email", email), ("password", secrets.token_hex(18))]:
                page.locator(f'input[name={field}]:visible').fill(value)
            page.get_by_role("button", name="Create account").click()
            page.wait_for_url("**/onboarding")
            page.locator("[name=businessName]").fill("Fixture workspace")
            page.locator("[name=locationName]").fill("Test office")
            page.locator("select").select_option("UTC")
            page.get_by_role("button", name="Create workspace").click()
            page.wait_for_url("**/dashboard*")
            page.goto(base + "/workspaces")
            expect(page.get_by_role("heading", name="Your workspaces")).to_be_visible()
            expect(page.get_by_role("link", name="Platform settings")).to_have_count(0)
            page.goto(base + SETTINGS)
            expect(page.get_by_text("404", exact=True)).to_be_visible()

            # Email is generated in-process and identifies only this fixture account.
            query(f"""insert into platform_admins(user_id) select id from "user" where email='{email}'""")
            page.goto(base + "/workspaces")
            page.get_by_role("link", name="Platform settings").click()
            stale = context.new_page()
            stale.goto(base + SETTINGS)
            expect(stale.get_by_label("Platform name")).to_be_visible()
            version = int(query("select count(*) from site_identity_versions")) + 1
            name = f"Fixture {width}"
            for label, value in [("Platform name", name), ("Tagline", f"{name} tagline"),
                                 ("Page title", f"{name} title"), ("Search description", f"{name} description")]:
                page.get_by_label(label, exact=True).fill(value)
            page.get_by_role("button", name="Save site identity").click()
            expect(page.get_by_role("status")).to_have_text("Site identity saved.")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            stale.get_by_label("Platform name").fill("Conflicting update")
            stale.get_by_role("button", name="Save site identity").click()
            expect(stale.get_by_role("status")).to_contain_text("A newer version was saved")
            public = browser.new_page(viewport={"width": width, "height": height})
            public.goto(base + "/login")
            expect(public).to_have_title(f"{name} title")
            expect(public.locator(".brand:visible")).to_have_text(name)
            expect(public.locator('meta[property="og:description"]')).to_have_attribute("content", f"{name} description")
            expect(public.locator(".entry-footer")).to_have_text(f"{name} tagline")
            query(f"""delete from platform_admins where user_id=(select id from "user" where email='{email}')""")
            page.get_by_label("Platform name").fill("Revoked update")
            page.get_by_role("button", name="Save site identity").click()
            expect(page.get_by_text("404", exact=True)).to_be_visible()
            assert int(query("select count(*) from site_identity_versions")) == version
            assert query(f"""select site_identity_versions.name from site_identity_versions join "user" on actor_id=id
                             where version={version} and email='{email}'""") == name
            context.close()
            public.close()
            print(f"{width}x{height} passed", flush=True)
        browser.close()


def run():
    with tempfile.TemporaryDirectory() as temp:
        directory = Path(temp)
        password = secrets.token_hex(24)
        container = subprocess.check_output([
            "docker", "run", "--rm", "-d", "-e", "POSTGRES_PASSWORD",
            "-p", "127.0.0.1::5432", "postgres:18.4-alpine",
        ], env={**os.environ, "POSTGRES_PASSWORD": password}, text=True).strip()
        try:
            def query(sql, database="agentflow_dev"):
                return subprocess.run(["docker", "exec", "-i", container, "psql", "-XqAt",
                                       "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database],
                                      input=sql, capture_output=True, text=True, check=True).stdout.strip()

            for _ in range(60):
                try:
                    query("select 1", "postgres")
                    break
                except subprocess.CalledProcessError:
                    time.sleep(0.5)
            query(f"create role agentflow_app login password '{password}';", "postgres")
            query("create database agentflow_dev owner agentflow_app;", "postgres")
            db_port = subprocess.check_output(["docker", "port", container, "5432"], text=True).strip().split(":")[-1]
            url = f"postgres://agentflow_app:{password}@127.0.0.1:{db_port}/agentflow_dev"
            (directory / ".env.local").write_text(f"DATABASE_URL={url}\n")
            (directory / "drizzle").symlink_to(ROOT / "drizzle")
            subprocess.run(["node", ROOT / "scripts/migrate.mts"], cwd=directory, check=True, stdout=subprocess.DEVNULL)
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0))
                port = sock.getsockname()[1]
            base = f"http://localhost:{port}"
            env = {**os.environ, "DATABASE_URL": url, "BETTER_AUTH_SECRET": secrets.token_hex(32),
                   "BETTER_AUTH_URL": base, "NEXT_TELEMETRY_DISABLED": "1"}
            # Next revalidates public pages on disk. Keep fixture identity out of the real build.
            shutil.copytree(ROOT / ".next", directory / ".next", ignore=shutil.ignore_patterns("cache", "dev"))
            for resource in ["node_modules", "public", "next.config.ts", "package.json"]:
                (directory / resource).symlink_to(ROOT / resource)
            with (directory / "server.log").open("w") as log:
                server = subprocess.Popen(["node", "node_modules/next/dist/bin/next", "start",
                                           "--hostname", "localhost", "--port", str(port)],
                                          cwd=directory, env=env, stdout=log, stderr=log)
                try:
                    for _ in range(60):
                        if server.poll() is not None:
                            raise RuntimeError("Isolated test server stopped during startup")
                        try:
                            with urlopen(base + "/login", timeout=2):
                                break
                        except OSError:
                            time.sleep(0.5)
                    check_browser(base, query)
                finally:
                    server.terminate()
                    server.wait(timeout=30)
        finally:
            subprocess.run(["docker", "stop", container], check=True, stdout=subprocess.DEVNULL)


if __name__ == "__main__":
    run()
