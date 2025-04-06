import { readFile, writeFile } from "fs/promises";

import { NextResponse } from "next/server";
import path from "path";

// Type User (doit correspondre à celui de create-user)
type User = {
  id: string;
  login: string;
  email: string;
  password: string; // Le mot de passe n'est pas modifié ici
  description?: string;
  detail?: string;
  status: "administrateur" | "redacteur" | "utilisateur";
  profileImage?: string | null;
};

// Chemin vers le fichier de stockage
const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

// Fonctions utilitaires (similaires à create-user)
async function readUsers(): Promise<User[]> {
  try {
    const data = await readFile(usersFilePath, "utf-8");
    return JSON.parse(data) as User[];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    console.error("Erreur lecture users.json:", error);
    throw new Error("Impossible de lire les données.");
  }
}

async function writeUsers(users: User[]): Promise<void> {
  try {
    await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur écriture users.json:", error);
    throw new Error("Impossible de sauvegarder les données.");
  }
}

// Handler pour la méthode PUT (mise à jour)
export async function PUT(
  request: Request,
  { params }: { params: { login: string } }
) {
  try {
    const targetLogin = params.login; // Récupérer le login depuis l'URL
    const updatedData = await request.json(); // Données envoyées par le formulaire admin
    const { email, description, detail, profileImage } = updatedData;

    // Validation simple
    if (!email) {
      return NextResponse.json(
        { message: "L email est requis." },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.login === targetLogin);

    if (userIndex === -1) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    // Vérifier si le nouvel email est déjà utilisé par un AUTRE utilisateur
    const emailExists = users.some(
      (u) => u.email === email && u.login !== targetLogin
    );
    if (emailExists) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé par un autre compte." },
        { status: 409 }
      );
    }

    // Mettre à jour les données de l'utilisateur
    // Ne modifie pas le login, password, status, id ici
    users[userIndex] = {
      ...users[userIndex], // Garder les anciennes données non modifiées
      email: email,
      description: description || users[userIndex].description || "",
      detail: detail || users[userIndex].detail || "", // Mise à jour du champ detail
      profileImage:
        profileImage !== undefined
          ? profileImage
          : users[userIndex].profileImage,
    };

    // Sauvegarder les modifications
    await writeUsers(users);

    // Renvoyer l'utilisateur mis à jour (sans mot de passe)
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Erreur API update-user (${params.login}):`, error);
    const message =
      error instanceof Error
        ? error.message
        : "Erreur interne du serveur lors de la mise à jour.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
