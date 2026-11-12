# Connect the registration form to a Google Sheet

About 10 minutes, once.

1. **Create the sheet.** Go to sheets.google.com, make a blank spreadsheet and name it, e.g. *Tech & Comms registrations*.
2. **Add the script.** In the sheet choose **Extensions → Apps Script**. Delete the sample code, paste in all of `Code.gs` from this folder, and click **Save**.
3. **Run setup once.** Pick `setup` in the function menu at the top and click **Run**. Google asks for permission: choose your account → **Advanced** → **Go to (project name)** → **Allow**. Two tabs appear in the sheet: *Registrations* and *By school*.
4. **Deploy it.** Click **Deploy → New deployment** → the gear icon → **Web app**.
   - Description: `Registrations`
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.
5. **Check it.** Open that URL in a browser. You should see `{"ok":true,"service":"Tech & Comms registrations"}`.
6. **Connect the website.** In the GitHub repo open `src/site.json`, find `"registration"` and paste the URL:

   ```json
   "registration": {
     "endpoint": "https://script.google.com/macros/s/XXXX/exec",
     "publicUrl": "https://your-site.vercel.app/#register"
   }
   ```

   `publicUrl` is the link people share on WhatsApp. Commit, and Vercel redeploys in about a minute.

7. **Test.** Submit the form on the live site. A new row appears in *Registrations*, and *By school* ranks universities by number of registrations.

"Anyone" access only lets people send new registrations. It does not let anyone read the sheet: only you and people you share the sheet with can see it.

If you later edit `Code.gs`, choose **Deploy → Manage deployments → Edit → Version: New version → Deploy**. That way the URL stays the same.

## Live admin (tech-and-comms.vercel.app/admin)

The same script also stores the website's content (tour calendar, speakers, announcement bar, the button next to the countdown, contact details). The admin page edits it, and the public site loads the latest version on every visit, so there is no redeploy.

1. **Update the script.** In Apps Script, select everything in `Code.gs`, delete it, and paste in the new `Code.gs` from this folder. Nothing should sit above the first `/**` or below the last `}`. Save.
2. **Run setup again** (function menu → `setup` → Run). It adds a *Content history* tab.
3. **Set the admin password.** Click the gear icon (**Project Settings**) on the left → **Script properties** → **Add script property**. Property: `ADMIN_PASSWORD`, value: a long password only admins know. Click **Save script properties**. To change it later, edit the value here; there is no need to redeploy.
4. **Deploy a new version.** **Deploy → Manage deployments** → pencil → **Version: New version** → **Deploy**. The URL stays the same.
5. **Sign in** at `https://tech-and-comms.vercel.app/admin` with that password, make a change and click **Publish changes**. Refresh the public site to see it.

Notes
- The first publish copies the content shown in the admin page into the script. Until then the site shows the copy built from `src/site.json`.
- Every publish is saved as a row in *Content history* (time + the full content). To undo, tell Claude which version to restore, or copy that row's JSON back through the admin page.
- After 10 wrong passwords in 15 minutes, sign-in is locked for 15 minutes for everyone.
- `src/site.json` is now only the fallback copy. Edit content in the admin page instead.
