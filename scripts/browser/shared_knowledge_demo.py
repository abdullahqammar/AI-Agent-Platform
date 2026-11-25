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


def test_answer(page, answer, published=False, question="What are your hours?"):
    page.get_by_label("Customer name").fill("Knowledge tester")
    page.get_by_role("button", name="Start published conversation" if published else "Start version test").click()
    page.get_by_label("Message", exact=True).fill(question)
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
        owner.get_by_role("link", name="Business Connect").click()
        library = owner.url
        owner.get_by_label("Fact name").fill("Hours")
        owner.get_by_label("Business information").fill("Open on Mondays.")
        owner.get_by_role("button", name="Add fact").click()
        expect(owner.get_by_role("status")).to_have_text("Changes saved.")
        assert owner.evaluate("document.documentElement.scrollWidth <= innerWidth")
        studio = library.rsplit("/", 1)[0] + "/assistant"
        agents = []
        for name in ["Reception", "Sales"]:
            owner.goto(studio)
            owner.get_by_label("Assistant name").fill(name)
            expect(owner.get_by_label("Assistant name")).to_have_value(name)
            owner.get_by_label("Add workspace knowledge").select_option(label="Hours · revision 1")
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
        expect(stale.get_by_role("status")).to_contain_text("This source changed")
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
        expect(region.get_by_role("link", name="Reception · published v1 · revision 1")).to_be_visible()
        draft_link = region.get_by_role("link", name="Sales · v2 · revision 2")
        expect(draft_link).to_be_visible()
        expect(region.get_by_role("link", name="Reception · v1 · revision 1", exact=True)).to_have_count(0)
        region.get_by_text("Retire fact", exact=True).click()
        region.get_by_role("button", name="Confirm retirement").click()
        expect(region.get_by_text("Revision 3 · Retired")).to_be_visible()
        stale_draft.get_by_role("button", name="Save new draft version").click()
        expect(stale_draft.get_by_text("The draft or its shared knowledge changed.", exact=False)).to_be_visible()
        stale_publish.get_by_role("button", name="Publish and enable").click()
        expect(stale_publish.get_by_text("The draft or its shared knowledge changed.", exact=False)).to_be_visible()
        expect(stale_publish.get_by_role("button", name="Publish and enable")).to_be_disabled()
        owner.goto(studio)
        expect(owner.get_by_label("Add workspace knowledge").locator("option")).to_have_count(1)
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
        # Add a reusable FAQ to both assistants. Existing releases keep their sources.
        question = "Where can I collect an order?"
        answer = "Collect your order at the front desk."
        owner.goto(library)
        owner.get_by_text("Add an FAQ", exact=True).click()
        owner.get_by_label("Customer question").fill(question)
        owner.get_by_label("Approved answer").fill(answer)
        owner.get_by_role("button", name="Save FAQ").click()
        expect(owner.get_by_role("status")).to_have_text("FAQ added.")
        faq = owner.get_by_role("region", name=question)
        for agent_url, next_version in [(agents[1], 4), (agents[0], 2)]:
            owner.goto(agent_url)
            owner.get_by_text("Edit configuration and knowledge").click()
            if next_version == 2:
                owner.get_by_role("button", name="Use revision 4 of Hours").click()
            owner.get_by_label("Add workspace knowledge").select_option(label=f"FAQ · {question} · revision 1")
            owner.get_by_role("button", name="Save new draft version").click()
            expect(owner.get_by_text(f"Version {next_version} · OpenAI", exact=False)).to_be_visible()
            test_answer(owner, answer, question=question)
        owner.goto(library)
        faq.get_by_text("Edit FAQ", exact=True).click()
        faq.get_by_label("Approved answer").fill("Collect your order at reception.")
        faq.get_by_role("button", name="Save revision").click()
        expect(faq.get_by_text("Revision 2", exact=True)).to_be_visible()
        owner.goto(agents[1])
        test_answer(owner, answer, question=question)
        owner.goto(library)
        owner.get_by_text("Import a catalogue", exact=True).click()
        owner.get_by_label("Catalogue name").fill("Workshop furniture")
        owner.get_by_label("Product rows").fill("OAK-1\tOak Table\tHoney finish, seats six.")
        owner.get_by_role("button", name="Import products").click()
        catalogue = owner.get_by_role("article", name="Workshop furniture")
        expect(catalogue).to_contain_text("Read-only snapshot")
        for name in ["Reception", "Sales"]:
            catalogue.get_by_role("button", name=f"Grant access for {name}").click()
            expect(catalogue.get_by_role("button", name=f"Revoke access for {name}")).to_be_visible()

        product_threads = []
        for index, agent in enumerate(agents):
            owner.goto(agent + "&version=1" if index == 0 else agent)
            test_answer(owner, "Honey finish", published=index == 0, question="Describe the Oak Table")
            product_threads.append(owner.url)

        def repeat_question(index, expected):
            owner.goto(product_threads[index])
            owner.get_by_label("Message", exact=True).fill("Describe the Oak Table")
            previous = owner.locator(".assistant-message").count()
            owner.get_by_role("button", name="Send", exact=True).click()
            expect(owner.locator(".assistant-message")).to_have_count(previous + 1)
            expect(owner.locator(".assistant-message").last).to_contain_text(expected)

        owner.goto(library)
        catalogue.get_by_role("button", name="Revoke access for Reception").click()
        expect(catalogue.get_by_role("button", name="Grant access for Reception")).to_be_visible()
        repeat_question(0, "No product details available.")
        repeat_question(1, "Honey finish")
        owner.goto(library)
        catalogue.get_by_text("Disconnect catalogue", exact=True).click()
        catalogue.get_by_role("button", name="Confirm disconnect").click()
        expect(catalogue).to_contain_text("Disconnected")
        repeat_question(1, "No product details available.")
        stale_draft.close()
        stale_publish.close()
        outsider = browser.new_page()
        register(outsider)
        outsider.goto(library)
        expect(outsider.get_by_text("404", exact=True)).to_be_visible()
        expect(outsider.get_by_text("Open on Tuesdays.")).to_have_count(0)
        expect(outsider.get_by_text(question, exact=True)).to_have_count(0)
        outsider.close()
        ctx.close()
        print(width, height, "shared knowledge passed", flush=True)
    browser.close()
