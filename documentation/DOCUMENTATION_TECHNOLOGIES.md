# Documentation des Technologies du Projet

Ce document contient la documentation récupérée via Context7 pour toutes les technologies utilisées dans ce projet d'application de généalogie avec authentification.

## 📚 Table des Matières

1. [Next.js 15](#nextjs-15)
2. [React 18](#react-18)
3. [TypeScript 5](#typescript-5)
4. [TailwindCSS 3.4](#tailwindcss-34)
5. [Prisma 6.5](#prisma-65)
6. [Vercel Blob](#vercel-blob)
7. [Chart.js & React-ChartJS-2](#chartjs--react-chartjs-2)
8. [Recharts](#recharts)
9. [bcrypt](#bcrypt)

---

## Next.js 15

### Version utilisée : 15.0.3

### Concepts clés

#### App Router et Server Components

Next.js 15 utilise le nouveau App Router avec des Server Components par défaut, permettant de récupérer les données directement sur le serveur.

#### Récupération de données dans Server Components

```tsx
// `app` directory
async function getProjects() {
  const res = await fetch(`https://...`, { cache: 'no-store' })
  const projects = await res.json()
  return projects
}

export default async function Dashboard() {
  const projects = await getProjects()

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

#### Stratégies de récupération de données

```tsx
export default async function Page() {
  // Cache statique (par défaut) - similaire à getStaticProps
  const staticData = await fetch(`https://...`, { cache: 'force-cache' })

  // Données dynamiques - similaire à getServerSideProps
  const dynamicData = await fetch(`https://...`, { cache: 'no-store' })

  // Revalidation après 10 secondes
  const revalidatedData = await fetch(`https://...`, {
    next: { revalidate: 10 },
  })

  return <div>...</div>
}
```

#### Route Handlers (API Routes dans App Router)

```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ received: body })
}
```

#### Accès aux paramètres de route

```tsx
// Server Components
export default async function Page({ 
  params,
  searchParams 
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return <div>ID: {params.id}</div>
}
```

#### Client Components avec hooks de navigation

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function ExampleClientComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // ...
}
```

### Ressources
- Documentation officielle : https://nextjs.org/docs
- App Router : https://nextjs.org/docs/app

---

## React 18

### Version utilisée : 18.x

### Concepts clés

#### Hooks d'état avec useState

```javascript
import { useState } from 'react';

function MyButton() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
```

#### Gestion d'état avec useReducer

```javascript
import { useReducer } from 'react';

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [...tasks, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

export default function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

  function handleAddTask(text) {
    dispatch({
      type: 'added',
      id: nextId++,
      text: text,
    });
  }
  // ...
}
```

#### Gestion de formulaire avec useState

```javascript
import { useState } from 'react';

export default function Form() {
  const [form, setForm] = useState({
    firstName: 'Barbara',
    lastName: 'Hepworth',
    email: 'bhepworth@sculpture.com',
  });

  return (
    <>
      <label>
        First name:
        <input
          value={form.firstName}
          onChange={e => {
            setForm({
              ...form,
              firstName: e.target.value
            });
          }}
        />
      </label>
      {/* ... */}
    </>
  );
}
```

### Ressources
- Documentation officielle : https://react.dev
- Hooks : https://react.dev/reference/react

---

## TypeScript 5

### Version utilisée : 5.x

### Concepts clés

#### Interfaces et Types

```typescript
// Interface
interface User {
  name: string;
  id: number;
}

// Type alias
type User = {
  name: string;
  id: number;
}

// Utilisation
function greet(person: User) {
  return "Hello " + person.name;
}
```

#### Interfaces génériques

```typescript
interface GenericIdentityFn<Type> {
  (arg: Type): Type;
}

function identity<Type>(arg: Type): Type {
  return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

#### Extension d'interfaces

```typescript
interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

interface ColorfulCircle extends Colorful, Circle {}

const cc: ColorfulCircle = {
  color: "red",
  radius: 42,
};
```

#### Types de fonctions

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function (source: string, sub: string): boolean {
  let result = source.search(sub);
  return result > -1;
};
```

### Ressources
- Documentation officielle : https://www.typescriptlang.org/docs
- Handbook : https://www.typescriptlang.org/docs/handbook/intro.html

---

## TailwindCSS 3.4

### Version utilisée : 3.4.1

### Concepts clés

#### Classes utilitaires

```html
<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>
```

#### États de survol (Hover)

```html
<button class="bg-sky-500 hover:bg-sky-700 ...">
  Save changes
</button>
```

#### Configuration dans tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
```

#### Classes d'ombres

```html
<div class="shadow-md ..."></div>
<div class="shadow-lg ..."></div>
<div class="shadow-xl ..."></div>
```

#### Utilisation dans les composants React

```tsx
export default function Home() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

### Ressources
- Documentation officielle : https://tailwindcss.com/docs
- Configuration : https://tailwindcss.com/docs/configuration

---

## Prisma 6.5

### Version utilisée : 6.5.0

### Concepts clés

#### Schéma Prisma de base

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
}

model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  email     String   @unique
  name      String?
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  title     String
  published Boolean  @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

#### Requêtes avec Prisma Client

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Créer un utilisateur
const newUser = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@prisma.io',
  },
})

// Récupérer tous les utilisateurs
const users = await prisma.user.findMany()

// Requête avec relations
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
  where: {
    published: true,
  },
})

// Mettre à jour
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Bob' },
})

// Supprimer
await prisma.user.delete({
  where: { id: 1 },
})
```

#### Génération du client Prisma

```bash
npx prisma generate
```

#### Options de requête

```typescript
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    content: true
  },
  where: {
    published: true
  },
  include: {
    author: true
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10,
  skip: 20
});
```

### Ressources
- Documentation officielle : https://www.prisma.io/docs
- Client Reference : https://www.prisma.io/docs/concepts/components/prisma-client

---

## Vercel Blob

### Version utilisée : 0.26.0

### Concepts clés

#### Upload de fichiers

```typescript
import { put } from '@vercel/blob';

// Upload simple
const blob = await put('documents/readme.txt', 'Hello World!', {
  access: 'public',
  addRandomSuffix: true,
  cacheControlMaxAge: 3600,
});

console.log(blob.url); // URL publique
console.log(blob.contentType); // Type MIME
```

#### Upload avec fichier

```typescript
const file = new File(['content'], 'largefile.zip');
const largeBlob = await put('uploads/archive.zip', file, {
  access: 'public',
  multipart: true,
  onUploadProgress: ({ loaded, total, percentage }) => {
    console.log(`Upload progress: ${percentage}%`);
  },
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
```

#### Upload multipart pour gros fichiers

```typescript
import { 
  createMultipartUpload, 
  uploadPart, 
  completeMultipartUpload 
} from '@vercel/blob';

// Étape 1: Créer l'upload multipart
const { key, uploadId } = await createMultipartUpload('videos/large-video.mp4', {
  access: 'public',
  contentType: 'video/mp4',
});

// Étape 2: Uploader les parties
const part1 = await uploadPart('videos/large-video.mp4', chunk1, {
  access: 'public',
  key,
  uploadId,
  partNumber: 1,
});

// Étape 3: Compléter l'upload
const finalBlob = await completeMultipartUpload(
  'videos/large-video.mp4', 
  [{ etag: part1.etag, partNumber: 1 }], 
  {
    access: 'public',
    key,
    uploadId,
  }
);
```

#### Copier un blob

```typescript
import { copy } from '@vercel/blob';

const copiedBlob = await copy(
  'https://your-store.public.blob.vercel-storage.com/original.jpg',
  'backup/original-copy.jpg',
  {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }
);
```

### Configuration

Assurez-vous d'avoir la variable d'environnement `BLOB_READ_WRITE_TOKEN` configurée dans votre projet Vercel.

### Ressources
- Documentation officielle : https://vercel.com/docs/storage/vercel-blob
- Package : https://www.npmjs.com/package/@vercel/blob

---

## Chart.js & React-ChartJS-2

### Versions utilisées :
- Chart.js: 4.4.6
- react-chartjs-2: 5.2.0

### Concepts clés

#### Configuration de base d'un graphique

```javascript
const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  },
};
```

#### Graphique linéaire

```javascript
const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Chart.js Line Chart'
      }
    }
  },
};
```

#### Graphique en barres empilées

```javascript
const config = {
  type: 'bar',
  data: data,
  options: {
    plugins: {
      title: {
        display: true,
        text: 'Chart.js Bar Chart - Stacked'
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true
      }
    }
  }
};
```

#### Utilisation avec React

```jsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MyChart() {
  return <Line data={data} options={options} />;
}
```

### Ressources
- Chart.js : https://www.chartjs.org/docs
- react-chartjs-2 : https://react-chartjs-2.js.org

---

## Recharts

### Version utilisée : 2.13.0

### Concepts clés

#### Graphique linéaire de base

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function LineChartExample() {
  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 1398, amt: 2210 },
    { name: 'Page C', uv: 200, pv: 9800, amt: 2290 },
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="uv" stroke="#8884d8" />
        <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### Graphique en aires avec dégradés

```jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AreaChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="uv"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorUv)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

#### Graphique composé (ComposedChart)

```jsx
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ComposedChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" scale="band" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### Ressources
- Documentation officielle : https://recharts.org
- GitHub : https://github.com/recharts/recharts

---

## bcrypt

### Version utilisée : 5.1.1

### Concepts clés

#### Hash de mot de passe (asynchrone avec Promises)

```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'password123';

// Avec Promises
bcrypt.hash(myPlaintextPassword, saltRounds)
  .then(function(hash) {
    // Stocker le hash dans la base de données
    console.log(hash);
  });
```

#### Hash de mot de passe (async/await)

```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}
```

#### Comparaison de mot de passe (asynchrone)

```javascript
const bcrypt = require('bcrypt');

// Comparer avec callback
bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
  // result == true si le mot de passe correspond
});

// Comparer avec Promises
bcrypt.compare(myPlaintextPassword, hash)
  .then(function(result) {
    // result == true si le mot de passe correspond
  });
```

#### Comparaison avec async/await

```javascript
async function checkUser(username, password) {
  // Récupérer l'utilisateur depuis la base de données
  const user = await getUserFromDB(username);
  
  const match = await bcrypt.compare(password, user.passwordHash);
  
  if (match) {
    // Connexion réussie
    return user;
  } else {
    // Mot de passe incorrect
    throw new Error('Invalid password');
  }
}
```

#### Méthodes synchrones

```javascript
// Hash synchrone
const hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);

// Comparaison synchrone
const match = bcrypt.compareSync(myPlaintextPassword, hash);
```

#### Génération de sel

```javascript
// Générer un sel avec callback
bcrypt.genSalt(saltRounds, function(err, salt) {
  bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
    // Stocker le hash
  });
});

// Générer un sel avec Promises
const salt = await bcrypt.genSalt(saltRounds);
const hash = await bcrypt.hash(myPlaintextPassword, salt);
```

### Bonnes pratiques

1. **Utilisez toujours des méthodes asynchrones** en production pour éviter de bloquer le thread
2. **Utilisez au moins 10 rounds de salt** pour un bon équilibre sécurité/performance
3. **Ne stockez jamais les mots de passe en clair**
4. **Utilisez async/await** pour une meilleure lisibilité du code

### Ressources
- Documentation : https://github.com/kelektiv/node.bcrypt.js
- NPM : https://www.npmjs.com/package/bcrypt

---

## Autres technologies utilisées

### Bibliothèques supplémentaires

- **react-d3-tree** (v3.6.6) : Visualisation d'arbres pour la généalogie
- **formidable** (v3.5.2) : Gestion des formulaires multipart/form-data
- **uuid** (v9.0.0) : Génération d'identifiants uniques
- **react-router-dom** (v6.28.0) : Routing côté client (si utilisé)

### Outils de développement

- **ESLint** (v8) : Linting du code
- **TypeScript ESLint** : Support TypeScript pour ESLint
- **PostCSS** (v8) : Traitement CSS

---

## 📝 Notes importantes

1. **Context7 MCP** : Toutes ces documentations ont été récupérées via le serveur MCP Context7, qui fournit une documentation à jour et spécifique aux versions.

2. **Versions** : Assurez-vous de vérifier les versions exactes dans votre `package.json` et de consulter la documentation correspondante.

3. **Mise à jour** : Ces documentations peuvent être mises à jour en utilisant Context7 avec la commande : "use context7 pour récupérer la documentation de [bibliothèque]"

4. **Compatibilité** : Vérifiez toujours la compatibilité entre les versions des bibliothèques utilisées.

---

## 🔗 Liens utiles

- **Next.js** : https://nextjs.org/docs
- **React** : https://react.dev
- **TypeScript** : https://www.typescriptlang.org/docs
- **TailwindCSS** : https://tailwindcss.com/docs
- **Prisma** : https://www.prisma.io/docs
- **Vercel Blob** : https://vercel.com/docs/storage/vercel-blob
- **Chart.js** : https://www.chartjs.org/docs
- **Recharts** : https://recharts.org
- **bcrypt** : https://github.com/kelektiv/node.bcrypt.js

---

*Document généré automatiquement avec Context7 MCP - Dernière mise à jour : $(date)*

