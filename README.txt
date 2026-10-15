GLOBAL SAVINGS WEBSITE TEMPLATE
================================

FILES
- index.html          Home page, hero, rotating/clickable demo testimonials
- about.html          About page
- testimonials.html   Testimonials page (sample reviews must be replaced)
- news.html           Savings education articles
- support.html        Support page with a demo-only message form
- get-started.html    Buttons leading to login and registration
- login.html          Firebase Email/Password login form
- register.html       Firebase Email/Password registration form
- styles.css          Shared responsive blue-and-white styling
- site.js             Mobile menu, dynamic testimonial carousel, current year
- firebase-config.js Firebase web config placeholders
- auth.js             Firebase Authentication logic

SETUP
1. In Firebase Console, open your project.
2. Go to Project settings > Your apps > Web app, and copy the web app configuration.
3. firebase-config.js is pre-filled with the Global Savings web configuration you supplied. Check it against Firebase Console > Project settings > Your apps before deploying.
4. In Firebase Console, go to Authentication > Sign-in method and enable Email/Password.
5. Serve the folder using a local development server or deploy it to a web host. ES modules usually do not work correctly when opening HTML directly as file://.
6. Test registration and login using a test account.
7. Configure Firebase authorized domains if your hosting domain requires it.

IMPORTANT
- This is a front-end starter template, not a bank or payment service.
- Do not collect real financial details or claim to accept deposits.
- Do not put service-account JSON files, private keys, passwords, or privileged tokens in frontend code.
- Configure appropriate Firebase security rules before adding Firestore or user data.
- Testimonials in the template are illustrative demo content, not verified real reviews. Replace them with genuine reviews and permission before publishing.
- The support form is demo-only and does not send/store messages.
- Successful login currently shows a confirmation message; it does not yet redirect to a protected dashboard.
