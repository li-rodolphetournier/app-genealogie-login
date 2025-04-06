import { mkdir, writeFile } from "fs/promises";

import { NextResponse } from "next/server";
import path from "path";

// Définir la taille maximale (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier n'a été envoyé" },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Le fichier est trop volumineux. La taille maximale est de 10MB.",
        },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Seules les images sont autorisées." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer le chemin complet du dossier d'upload
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    // S'assurer que le dossier existe
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
    }

    // Créer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const fileName = `${uniqueSuffix}-${originalName}`;

    // Chemin complet du fichier
    const filePath = path.join(uploadDir, fileName);

    // Écrire le fichier
    await writeFile(filePath, buffer);

    // Retourner le chemin relatif pour l'URL - Correction pour éviter double slash
    const publicPath = folder
      ? `/uploads/${folder}/${fileName}`
      : `/uploads/${fileName}`;

    return NextResponse.json({
      message: "Fichier uploadé avec succès",
      fileName: fileName,
      imageUrl: publicPath,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Désactiver le parser par défaut
    responseLimit: false, // Désactiver la limite de taille de réponse
  },
};
