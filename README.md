# AURELLE — AI-powered smart fashion store (prototype)

A complete storefront and admin dashboard for your own clothing brand. Four ways to shop: browse the **Shop**, **Find Your Match**, **Build Your Outfit** (with automatic bundle discount) and **Upload & Match** (photo-based recommendations). Everything recommended comes from your own catalogue.

No build step, no `npm install`. It deploys to Vercel as-is.

---

## 1. Try it on your computer (optional)

You need [Node.js](https://nodejs.org) (LTS). In the project folder:

```
npm run dev
```

Open http://localhost:3000.

**Prototype logins**

| Who | Email | Password |
|---|---|---|
| Admin | admin@aurelle.test | Admin@123 |
| Customer | demo@aurelle.test | Demo@123 |

---

## 2. Put the code on GitHub

**One-time setup**

1. Create a free account at https://github.com/signup.
2. Install Git: https://git-scm.com/downloads (on Windows keep the default options).
3. Tell Git who you are (once per computer):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

**Create the repository**

1. On GitHub, click **+** (top right) → **New repository**.
2. Name it, for example `aurelle-store`. Choose **Private** (recommended) or Public.
3. Do **not** tick "Add a README", ".gitignore" or a licence. Click **Create repository**.
4. GitHub now shows a page with your repository address, like `https://github.com/YOUR-USERNAME/aurelle-store.git`. Copy it.

**Push your files**

Open a terminal inside the project folder (the one containing `index.html`) and run:

```
git init
git add .
git commit -m "First version of my store"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/aurelle-store.git
git push -u origin main
```

When Git asks you to sign in, a browser window opens. Approve it. GitHub no longer accepts your account password in the terminal. If no browser opens, create a *Personal Access Token* (GitHub → Settings → Developer settings → Personal access tokens) and paste it as the password.

Prefer clicking? Install **GitHub Desktop** (https://desktop.github.com), choose *File → Add local repository*, then *Publish repository*.

Refresh the GitHub page. You should see all your files.

> Never commit real API keys. `.gitignore` already excludes `.env` files. Keys go into Vercel (step 3).

---

## 3. Deploy to Vercel (free HTTPS website)

1. Go to https://vercel.com/signup and choose **Continue with GitHub**.
2. Click **Add New… → Project**.
3. Find `aurelle-store` in the list and click **Import**. (If it is missing, click *Adjust GitHub App Permissions* and allow that repository.)
4. Leave the settings as they are:
   - **Framework Preset:** Other
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
5. Click **Deploy**. After about 30 seconds you get a live address like `https://aurelle-store.vercel.app`. It is HTTPS by default.

**Updating your site later:** change files, then
```
git add .
git commit -m "Describe the change"
git push
```
Vercel redeploys automatically within a minute.

**Using your own domain:** Vercel project → **Settings → Domains** → add `yourbrand.in` and follow the DNS instructions.

---

## 4. Switch on the optional features

Vercel project → **Settings → Environment Variables**. Add these, then go to **Deployments → ⋯ → Redeploy**.

| Variable | What it enables | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI vision in Upload & Match (reads the garment type, colour and pattern from the photo). Get a key at https://console.anthropic.com | The site reads colour and pattern on the customer's device and lets them correct it |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Real online payments through Razorpay (UPI, cards, net banking). Use **test keys** first from https://dashboard.razorpay.com | Checkout shows a clearly labelled simulated payment. No card details are ever collected by this site |

---

## 5. Run your store

Sign in as admin → **My account → Admin dashboard** (or `/#/admin`).

- **Products:** add, edit, delete. Upload several photos per product, set sale prices, colours, sizes and stock per size.
- **Categories:** create your own. Each category "behaves like" a top, bottom, shoes, layer or accessory, which controls matching and the outfit builder.
- **Outfits & bundles:** set the complete-outfit discount (percentage or flat ₹), and create curated outfits for the homepage.
- **Orders:** move orders through Placed → Packed → Shipped → Out for delivery → Delivered. Customers see this on their tracking page.
- **Settings → Sample data:** *Remove all sample data* clears the demo products, outfits and orders so you can start with your own.

---

## 6. Before you take real customers

The prototype stores data **in each visitor's own browser** (localStorage). That is perfect for testing the experience, and it is the one thing you must replace before launch:

| Prototype | For launch |
|---|---|
| Products, orders and users live in one browser | A hosted database, such as Supabase (Postgres) or Firebase |
| Sign-in and the admin role are checked in the browser | Real authentication with server-side role checks (Supabase Auth, Clerk or Auth.js) |
| Product photos are stored in the browser | Image storage (Supabase Storage, Cloudinary or Vercel Blob) |
| Order total is sent from the browser to `/api/create-order` | Compute the amount on the server from the stored cart |
| Orders are not emailed | Transactional email (Resend, Postmark) |

The code is organised for this swap: `js/store.js` is the single data layer. Replace its load/save, login, order and product functions with database calls and the pages keep working. Also change or delete the demo logins.

**Important:** until then, treat the live site as a demo. Products you add as admin are visible only in the browser where you added them. Use **Settings → Download backup** to keep a copy.

---

## 7. Project map

```
index.html              page shell
css/styles.css          all styling (colours are CSS variables at the top)
js/app.js               router, header, footer, cart drawer, search
js/store.js             data layer: products, cart, pricing, bundles, auth, orders
js/match.js             colour-theory matching engine
js/garments.js          drawn product illustrations (replaced by your photos)
js/analyze.js           photo analysis for Upload & Match
js/pages/*.js           home, shop, product, match, build, upload, cart, checkout, account, admin
api/analyze.js          optional AI vision (Vercel serverless function)
api/create-order.js     Razorpay order creation
api/verify-payment.js   Razorpay signature check
vercel.json             security headers
```

To change the colour palette, edit the `:root` variables at the top of `css/styles.css`. To change the brand name and tagline, use **Admin → Settings**.
