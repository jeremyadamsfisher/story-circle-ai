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
