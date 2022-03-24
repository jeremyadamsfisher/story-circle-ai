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
- In the Auth0 dashboard:
  - create a single page app and add:
**Allowed Callback URLs:** `http://localhost:3000/oauth2redirect`
**Allowed Web Origins** `http://localhost:3000/oauth2redirect`
  - on this page, note the domain and 
  - create an API and note the identifier, which is the "audience" from the perspective of the client
- Also in the Auth0 dashboard, grab the domain, client id and audience (i.e., API's identifier) and throw them into `frontend/src/auth0config.json` like so:
```json
{
  "domain": "foo.us.auth0.com",
  "clientId": "bar",
  "audience": "http://baz.com",
  "scope": "read:storylist write:segment"
}
```
- Add those scopes to the API permission list
- Create a dot file for the backend, filling in information from Terraform, Auth0, your DNS provider and your mail server
```
PGCONNSTR="qux"
PGUSER="quuux@vantai-analysis.iam"
PGDATABASEINSTANCE="corge"
PGDATABASE="grault"
DOMAIN="foo.us.auth0.com"
API_AUDIENCE="http://baz.com"
ISSUER="https://graply.us.auth0.com/"
ALGORITHMS="RS256"

# ripped from https://github.com/sabuhish/fastapi-mail
MAIL_USERNAME="YourUsername"
MAIL_PASSWORD="strong_password"
MAIL_FROM="your@email.com"
MAIL_PORT="587"
MAIL_SERVER="your mail server"

APP_ORIGIN="http://awesomewebsite.com"
```
