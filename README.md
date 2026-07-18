# Southern Bobby-Q Catering — Website

A small Node.js/Express site with:
- Home, Menu, Events, and Contact pages
- A contact/catering-request form (submissions saved to the database)
- A public events calendar
- A password-protected admin page to add/remove events and view contact submissions

Built to run on **Railway** (app + Postgres database), with the domain registered through **Namecheap**.

---

## Part 1 — Buy the domain (Namecheap)

1. Go to namecheap.com and search for the domain you want (e.g. `southernbobbyq.com`).
2. Add it to your cart and complete checkout. Skip the upsells (hosting, email, VPN, WhoisGuard is fine to keep — it's usually free for the first year and hides your personal info from public WHOIS records).
3. Once purchased, go to **Domain List → Manage** next to your new domain. You'll come back to this page's **Advanced DNS** tab in Part 3 — no need to change anything yet.

That's it for now — don't set up hosting or DNS on Namecheap. Railway handles that.

---

## Part 2 — Deploy the app on Railway

1. **Push this code to GitHub.** Railway deploys from a GitHub repo.
   - Create a new repo (e.g. `southern-bobby-q`) on github.com.
   - From this project folder:
     ```
     git init
     git add .
     git commit -m "Initial site"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/southern-bobby-q.git
     git push -u origin main
     ```

2. **Create the Railway project.**
   - In your Railway dashboard, click **New Project → Deploy from GitHub repo** and pick the repo you just pushed.

3. **Add a Postgres database.**
   - In the same Railway project, click **New → Database → Add PostgreSQL**.
   - Railway automatically injects a `DATABASE_URL` variable into your app service — you don't need to copy/paste it yourself.

4. **Set environment variables on the app service** (Railway dashboard → your app service → **Variables**):
   - `SESSION_SECRET` — any long random string (e.g. generate one with `openssl rand -hex 32`).
   - `ADMIN_USERNAME` — whatever username you want to log in with (e.g. `bobbyq`).
   - `ADMIN_PASSWORD_HASH` — see below for how to generate this.

   To generate the password hash, run this on your own computer (with Node installed):
   ```
   npm install bcryptjs
   node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
   ```
   Copy the printed string (starts with `$2a$` or `$2b$`) into `ADMIN_PASSWORD_HASH`. Don't put your plain password in Railway — only the hash.

5. **Deploy.** Railway will detect the Node app (via `package.json`), run `npm install`, then `npm start`. Once it's live, Railway gives you a temporary URL like `southern-bobby-q-production.up.railway.app` — open it to confirm the site works.

6. **Verify the admin page.** Go to `/admin/login` on that Railway URL and log in with the username/password you chose. You should see the dashboard where you can add events and view contact form submissions.

---

## Part 3 — Connect the Namecheap domain to Railway

1. In Railway, go to your app service → **Settings → Networking → Custom Domain**, and add your domain (e.g. `southernbobbyq.com` and/or `www.southernbobbyq.com`).
2. Railway will show you a DNS record to add — typically a `CNAME` pointing to something like `xxxx.up.railway.app` (for `www`) and a set of `A`/`ANAME` style records for the bare root domain, or Railway may just give you one CNAME target to use for both.
3. Go back to Namecheap → **Domain List → Manage → Advanced DNS**, and add the record(s) Railway gave you:
   - Type: `CNAME Record`, Host: `www`, Value: (whatever Railway shows), TTL: Automatic.
   - For the bare/root domain, Namecheap doesn't support ANAME/ALIAS on all plans — if Railway only gives a CNAME, use Namecheap's **URL Redirect Record** to send the root domain to `www`, or check Railway's docs for root-domain instructions at the time you set this up (this changes occasionally).
4. DNS changes can take anywhere from a few minutes to a few hours to propagate. Railway will show the domain as "Active" once it detects the record.

---

## Local development (optional)

If you want to run this on your own machine before deploying:

```
npm install
cp .env.example .env
# edit .env: point DATABASE_URL at a local or Railway Postgres instance,
# set SESSION_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD_HASH
npm start
```

Then visit `http://localhost:3000`.

---

## What to send me next

- Your logo/photos (if you have any) to swap in for the placeholder styling.
- Real menu items and prices — the Menu page currently has placeholder items.
- Your business address, phone number, and social links for the footer/contact page.
- Your first few events, so the calendar isn't empty on launch (or you can add these yourself via `/admin` once it's deployed).
