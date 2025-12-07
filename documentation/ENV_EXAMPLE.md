# Variables d'environnement nécessaires

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Supabase Configuration
# URL de votre projet Supabase (trouvable dans Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Clé publique/anonyme (trouvable dans Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé service role (SECRÈTE - ne jamais exposer publiquement)
# Trouvable dans Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Comment obtenir ces valeurs

1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRÈTE!)

## Sécurité

- ⚠️ Ne commitez jamais le fichier `.env.local` (déjà dans `.gitignore`)
- ⚠️ Ne partagez jamais votre `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ Pour la production (Vercel), ajoutez ces variables dans les paramètres du projet

