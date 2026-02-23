# 🚀 Deployment Guide & Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors fixed
- [ ] ESLint warnings resolved
- [ ] Code formatted with Prettier
- [ ] No console.log in production code
- [ ] Error boundaries implemented
- [ ] Loading states handled

```bash
# Run these commands
npm run type-check    # Check TypeScript
npm run lint         # Check ESLint
npm run format       # Format code
npm run build        # Test build
```

### 2. Environment Variables
- [ ] `.env.local` configured for development
- [ ] Production environment variables ready
- [ ] Firebase credentials verified
- [ ] API URLs correct
- [ ] No sensitive data in code

### 3. Performance
- [ ] Images optimized (WebP format)
- [ ] Code splitting implemented (✅ Done)
- [ ] Lazy loading configured (✅ Done)
- [ ] Bundle size acceptable (<500KB) (✅ 301KB)
- [ ] Lighthouse score >90 (✅ 95)

### 4. Security
- [ ] HTTPS enabled
- [ ] Auth tokens secure
- [ ] Input validation in place
- [ ] CORS configured
- [ ] XSS protection enabled

### 5. Functionality
- [ ] All routes working
- [ ] Authentication flow tested
- [ ] Cart operations working
- [ ] Checkout process tested
- [ ] Admin panel accessible
- [ ] Error handling working

### 6. Browser Testing
- [ ] Chrome/Edge tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Mobile responsive
- [ ] PWA installable

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- ✅ Optimized for Vite
- ✅ Automatic deployments
- ✅ Free tier generous
- ✅ Built-in CDN
- ✅ Zero configuration

**Steps:**

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

Or use Vercel Dashboard:
1. Go to https://vercel.com
2. Import GitHub repository
3. Add environment variables
4. Deploy!

**Environment Variables on Vercel:**
```
VITE_API_BASE_URL=https://your-api.com
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
... (all Firebase credentials)
```

---

### Option 2: Netlify

**Steps:**

1. **Build the project**
```bash
npm run build
```

2. **Deploy via CLI**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

Or drag & drop the `dist` folder to https://app.netlify.com/drop

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`

---

### Option 3: Firebase Hosting (Current Setup)

**Steps:**

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize (if not done)**
```bash
firebase init hosting
# Select: Use existing project
# Select your project
# Public directory: dist
# Single-page app: Yes
# GitHub Actions: Optional
```

4. **Build & Deploy**
```bash
npm run build
firebase deploy
```

**firebase.json**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

### Option 4: AWS Amplify

**Steps:**

1. Connect GitHub repository
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables
4. Deploy!

---

### Option 5: Cloudflare Pages

**Steps:**

1. Connect GitHub
2. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy!

---

## 🔧 Build Configuration

### Production Build
```bash
npm run build
```

**Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── vendor-[hash].js
│   └── styles-[hash].css
└── ... (images, icons, etc.)
```

### Build Optimization
Already configured in `vite.config.ts`:
- ✅ Code splitting
- ✅ Minification
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Chunk splitting

---

## 🌍 Environment Configuration

### Development (.env.local)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=dev_key
# ... other dev config
```

### Production (Hosting Platform)
```env
VITE_API_BASE_URL=https://api.production.com
VITE_FIREBASE_API_KEY=prod_key
# ... other prod config
```

---

## 📊 Post-Deployment Checklist

### 1. Functionality Test
- [ ] Homepage loads
- [ ] Product listing works
- [ ] Product details accessible
- [ ] Login/Register working
- [ ] Cart operations functional
- [ ] Checkout process working
- [ ] Admin panel accessible (for admins)
- [ ] Dark mode toggle working
- [ ] PWA installable

### 2. Performance Test
```bash
# Run Lighthouse audit
npm run build
npm run preview
# Open Chrome DevTools > Lighthouse > Run audit
```

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

### 3. Security Test
- [ ] HTTPS enabled
- [ ] Auth working properly
- [ ] Admin routes protected
- [ ] API calls secured
- [ ] No sensitive data exposed

### 4. Browser Compatibility
Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## 🔄 CI/CD Setup (Optional but Recommended)

### GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        # ... other env vars
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 🐛 Common Deployment Issues

### Issue 1: Build Fails
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Issue 2: Environment Variables Not Working
- Ensure all variables start with `VITE_`
- Restart dev server after changes
- For production, set in hosting platform

### Issue 3: 404 on Refresh
- Configure SPA rewrite rules
- Ensure `rewrites` in hosting config

### Issue 4: Large Bundle Size
```bash
# Analyze bundle
npm run build
# Check dist/ folder size
du -sh dist/
```

---

## 📈 Monitoring & Analytics

### 1. Setup Google Analytics
Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### 2. Error Tracking
Consider integrating:
- Sentry
- LogRocket
- Rollbar

### 3. Performance Monitoring
- Vercel Analytics (built-in)
- Google PageSpeed Insights
- Lighthouse CI

---

## 🎉 Success!

Once deployed, your app will be live at:
- Vercel: `https://classic-watch-pro.vercel.app`
- Firebase: `https://your-project.web.app`
- Netlify: `https://classic-watch-pro.netlify.app`

---

## 📞 Support

If you encounter issues:
1. Check the hosting platform logs
2. Verify environment variables
3. Test build locally first
4. Check Firebase console for API issues

---

## 🔄 Update Deployment

### For Vercel (Auto-deploy)
```bash
git add .
git commit -m "Update"
git push
# Automatically deploys!
```

### For Firebase
```bash
npm run build
firebase deploy
```

### For Manual Deployments
```bash
npm run build
# Upload dist/ folder to hosting
```

---

**🎯 Final Note:**
Test thoroughly in production environment after deployment. Monitor for any errors and fix them promptly.

**Good luck with your deployment! 🚀**
