# Storytelling with AI collaborators

## Bootstrap

- Run Terraform
- Add SQL grants to the APP user

```sql
GRANT ALL ON ALL TABLES IN SCHEMA "public"
TO "story-circle-app-sa@story-circle-ai.iam";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public"
TO "story-circle-app-sa@story-circle-ai.iam";
```

- In the Firebase dashboard,
  - create a web client and copy `firebaseConfig` to `frontend/lib/auth.ts`
  - go to "Authentication" > "Settings" and add the domain
- Create a dot file for the backend, filling in information from Terraform, your DNS provider, your mail server and huggingface.

```
APP_ENV="LOCAL"
HUGGINGFACE_API_TOKEN=foo
FRONTEND_URL=http://awesomewebsite.com

# only needed for migrations
PGCONNSTR=bar

# ripped from https://github.com/sabuhish/fastapi-mail
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=strong_password
MAIL_FROM=your@email.com
MAIL_PORT=587
MAIL_SERVER=mail.privateemail.com
```
