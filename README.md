# Repair Café Hobart — first website draft

A responsive, single-page site built with plain HTML, CSS and a small amount of JavaScript. All website files sit at the repository root for a direct GitHub Pages upload; no build step is needed.

## Before publishing

Replace the clearly marked placeholders in `index.html`:

- The next café is confirmed for **Saturday 17 October 2026, 1–4 pm**. Confirm venue access details and any booking requirements before launch.
- Verify the public email address and social links shown on the site before launch.
- Add the working volunteer form/signup URL when the roster signup system is ready. The temporary button currently opens an email to the public contact address.
- Confirm repair categories and the wording about what visitors should bring.
- Add approved photos and image permissions if desired. The hero artwork is CSS illustration and does not need an image file.
- Check the About copy, accessibility details and any safety or participation policy with the organisers.

The next café date and time were confirmed by Lesley. The recurring schedule, venue address, public email, Facebook page and Instagram handle are based on the supplied Repair Café details document. Volunteer categories came from the roster workbook reference. Venue access details and volunteer form destination still need confirmation.

## Connect the roster signup

The volunteer call-to-action is prepared to connect to a separate signup form. GitHub Pages serves static files and does not process or store form submissions. When the public signup form is confirmed, add its URL to the volunteer buttons and replace the temporary email option. Keep volunteer names, contact details and roster records in the form provider/workbook with appropriate access controls; do not publish those details in this repository.

## Publish with GitHub Pages

1. Create a GitHub repository for the site (for example, `repair-cafe-hobart`). If it will contain only public information, a public repository makes the free Pages route straightforward.
2. Upload the contents of this folder to the repository's top level so `index.html` sits at the root.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select the `main` branch and `/(root)`, then save.
4. Wait for the Pages deployment to finish. GitHub will show the published address in **Settings → Pages**. Review it on a phone and desktop before sharing it.
5. Add a custom domain later if desired, then follow GitHub's DNS and HTTPS instructions.

Keep the repository limited to approved public website content. Never upload the volunteer roster workbook or private volunteer information to a public repository.

The supplied details document contains private account information; it was excluded from the website. Only public-facing organisation details were used.
