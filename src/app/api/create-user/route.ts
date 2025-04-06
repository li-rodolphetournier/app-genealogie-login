import { readFile, writeFile } from "fs/promises";

import { NextResponse } from "next/server";
import path from "path";

// Supprimer les imports Prisma et bcrypt
// import { Prisma } from "@prisma/client";
// import bcrypt from "bcrypt";
// import prisma from "@/lib/prisma";

// Définir le type User (peut être importé d'un fichier partagé si vous en avez un)
type User = {
  id: string; // Ajouter un ID unique
  login: string;
  email: string;
  password: string; // Mot de passe stocké en clair (moins sécurisé)
  description?: string;
  detail?: string; // Nouveau champ multiligne
  status: "administrateur" | "redacteur" | "utilisateur";
  profileImage?: string | null;
};

// Chemin vers le fichier de stockage des utilisateurs
// Ajustez si nécessaire
const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

// Fonction pour lire les utilisateurs depuis le fichier JSON
async function readUsers(): Promise<User[]> {
  try {
    const data = await readFile(usersFilePath, "utf-8");
    return JSON.parse(data) as User[];
  } catch (error: any) {
    // Si le fichier n'existe pas ou est vide, retourner un tableau vide
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Erreur de lecture du fichier users.json:", error);
    throw new Error("Impossible de lire les données utilisateur.");
  }
}

// Fonction pour écrire les utilisateurs dans le fichier JSON
async function writeUsers(users: User[]): Promise<void> {
  try {
    await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur d'écriture dans le fichier users.json:", error);
    throw new Error("Impossible de sauvegarder les données utilisateur.");
  }
}

export async function POST(request: Request) {
  try {
    // 1. Lire les données JSON envoyées par le frontend
    const newUserRequestData = await request.json();
    const {
      login,
      email,
      password,
      description,
      detail,
      status,
      profileImage,
    } = newUserRequestData;

    // 2. Validation basique des données reçues
    if (!login || !email || !password || !status) {
      return NextResponse.json(
        {
          message:
            "Champs obligatoires (login, email, password, status) manquants.",
        },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit faire au moins 6 caractères." },
        { status: 400 }
      );
    }
    // Ajoutez d'autres validations si nécessaire

    // 3. Lire les utilisateurs existants
    const users = await readUsers();

    // 4. Vérifier si l'utilisateur ou l'email existe déjà
    const existingUser = users.find(
      (u) => u.login === login || u.email === email
    );
    if (existingUser) {
      const field = existingUser.login === login ? "Login" : "Email";
      return NextResponse.json(
        { message: `${field} déjà utilisé.` },
        { status: 409 }
      ); // 409 Conflict
    }

    // 5. Créer le nouvel objet utilisateur (avec un ID simple)
    const newUser: User = {
      id: Date.now().toString(), // Génération d'un ID simple basé sur le timestamp
      login,
      email,
      password, // ATTENTION: Mot de passe stocké en clair !
      description: description || "",
      detail: detail || "", // Ajouter le champ detail
      status,
      profileImage: profileImage || null,
    };

    // 6. Ajouter le nouvel utilisateur au tableau
    users.push(newUser);

    // 7. Écrire le tableau mis à jour dans le fichier
    await writeUsers(users);

    // 8. Renvoyer une réponse de succès (peut-être sans le mot de passe)
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error("Erreur API create-user:", error);

    // Renvoyer une erreur générique JSON
    const message =
      error instanceof Error
        ? error.message
        : "Erreur interne du serveur lors de la création de l utilisateur.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// La configuration bodyParser: false n'est plus nécessaire car on traite du JSON
// export const config = { ... }; // Supprimez ou commentez cette section
