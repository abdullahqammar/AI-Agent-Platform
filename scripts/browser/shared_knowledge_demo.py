"""Exercise versioned workspace facts using the local assistant fixture."""
import secrets
from playwright.sync_api import expect, sync_playwright

BASE = "http://localhost:3000"


def register(page):
    page.goto(BASE + "/register")
    for field, value in [
        ("name", "Library owner"), ("email", secrets.token_hex(8) + "@example.test"),
        ("password", secrets.token_hex(16)),
    ]:
        page.locator(f'input[name={field}]:visible').fill(value)
    page.get_by_role("button", name="Create account").click()
    page.wait_for_url("**/onboarding")


def test_answer(page, answer, published=False):
    page.get_by_label("Customer name").fill("Knowledge tester")
    page.get_by_role("button", name="Start published conversation" if published else "Start version test").click()
    page.get_by_label("Message", exact=True).fill("What are your hours?")
    page.get_by_role("button", name="Send", exact=True).click()
    expect(page.locator(".assistant-message")).to_contain_text(answer)


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    for width, height in [(1440, 900), (390, 844)]:
        ctx = browser.new_context(viewport={"width": width, "height": height})
        owner = ctx.new_page()
        register(owner)
        owner.locator("[name=businessName]").fill("Studio")
        owner.locator("[name=locationName]").fill("Main office")
        owner.locator("select").select_option("UTC")
        owner.get_by_role("button", name="Create workspace").click()
        owner.get_by_role("link", name="Shared knowledge").click()
        library = owner.url
        owner.get_by_label("Fact name").fill("Hours")
        owner.get_by_label("Business information").fill("Open on Mondays.")
        owner.get_by_role("button", name="Add fact").click()
        expect(owner.get_by_role("status")).to_have_text("Fact saved.")
        assert owner.evaluate("document.documentElement.scrollWidth <= innerWidth")
        studio = library.rsplit("/", 1)[0] + "/assistant"
        agents = []
        for name in ["Reception", "Sales"]:
            owner.goto(studio)
            owner.get_by_label("Assistant name").fill(name)
            expect(owner.get_by_label("Assistant name")).to_have_value(name)
            owner.get_by_label("Add a workspace fact").select_option(label="Hours · revision 1")
            owner.get_by_role("button", name="Remove source").first.click()
            owner.get_by_role("button", name="Save new draft version").click()
            owner.wait_for_url("**/assistant?agent=*")
            agents.append(owner.url)
        owner.goto(agents[0])
        test_answer(owner, "Open on Mondays.")
        owner.get_by_role("button", name="Publish and enable").click()
        expect(owner.get_by_text("Enabled · Published version 1")).to_be_visible()

        stale = ctx.new_page()
        stale.goto(library)
        owner.goto(library)
        for page in [stale, owner]:
            page.get_by_text("Edit fact", exact=True).click()
        region = owner.get_by_role("region", name="Hours")
        region.get_by_label("Business information").fill("Open on Tuesdays.")
        region.get_by_role("button", name="Save revision").click()
        expect(region.get_by_text("Revision 2")).to_be_visible()
        stale.get_by_role("button", name="Save revision").click()
        expect(stale.get_by_role("status")).to_contain_text("This fact changed")
        stale.close()

        owner.goto(agents[0])
        test_answer(owner, "Open on Mondays.", published=True)
        owner.goto(agents[1])
        test_answer(owner, "Open on Mondays.")
        owner.get_by_text("Edit configuration and knowledge").click()
        owner.get_by_role("button", name="Use revision 2 of Hours").click()
        owner.get_by_role("button", name="Save new draft version").click()
        expect(owner.get_by_text("Version 2 · OpenAI", exact=False)).to_be_visible()
        test_answer(owner, "Open on Tuesdays.")
        # Keep valid pre-retirement forms in separate tabs to exercise the server checks.
        stale_draft = ctx.new_page()
        stale_draft.goto(agents[1])
        stale_draft.get_by_text("Edit configuration and knowledge").click()
        stale_publish = ctx.new_page()
        stale_publish.goto(agents[1])
        expect(stale_publish.get_by_role("button", name="Publish and enable")).to_be_enabled()
        owner.goto(library)
        expect(region.get_by_role("link", name="Reception · published v1 · fact revision 1")).to_be_visible()
        region.get_by_text("Retire fact", exact=True).click()
        region.get_by_role("button", name="Confirm retirement").click()
        expect(region.get_by_text("Revision 3 · Retired")).to_be_visible()
        stale_draft.get_by_role("button", name="Save new draft version").click()
        expect(stale_draft.get_by_text("The draft or its shared knowledge changed.", exact=False)).to_be_visible()
        stale_publish.get_by_role("button", name="Publish and enable").click()
        expect(stale_publish.get_by_text("The draft or its shared knowledge changed.", exact=False)).to_be_visible()
        expect(stale_publish.get_by_role("button", name="Publish and enable")).to_be_disabled()
        owner.goto(studio)
        expect(owner.get_by_label("Add a workspace fact").locator("option")).to_have_count(1)
        owner.goto(agents[0])
        test_answer(owner, "Open on Mondays.", published=True)
        owner.goto(library)
        region.get_by_text("Review and restore").click()
        region.get_by_label("Business information").fill("Open on Thursdays.")
        region.get_by_role("button", name="Restore as new revision").click()
        expect(region.get_by_text("Revision 4", exact=True)).to_be_visible()
        owner.goto(agents[1])
        expect(owner.get_by_role("button", name="Publish and enable")).to_be_disabled()
        owner.get_by_text("Edit configuration and knowledge").click()
        owner.get_by_role("button", name="Use revision 4 of Hours").click()
        owner.get_by_role("button", name="Save new draft version").click()
        expect(owner.get_by_text("Version 3 · OpenAI", exact=False)).to_be_visible()
        test_answer(owner, "Open on Thursdays.")
        stale_draft.close()
        stale_publish.close()
        outsider = browser.new_page()
        register(outsider)
        outsider.goto(library)
        expect(outsider.get_by_text("404", exact=True)).to_be_visible()
        expect(outsider.get_by_text("Open on Tuesdays.")).to_have_count(0)
        outsider.close()
        ctx.close()
        print(width, height, "shared knowledge passed", flush=True)
    browser.close()
