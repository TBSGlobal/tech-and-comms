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
