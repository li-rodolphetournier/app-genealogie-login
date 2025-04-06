import { NextApiRequest, NextApiResponse } from "next";

import { ObjectData } from "@/types/objects";
import fs from "fs/promises";
import path from "path";

const objectsFilePath = path.join(process.cwd(), "src", "data", "objects.json");

async function readObjects(): Promise<ObjectData[]> {
  try {
    const data = await fs.readFile(objectsFilePath, "utf-8");
    return JSON.parse(data) as ObjectData[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Erreur lecture objects.json:", error);
    throw new Error("Impossible de lire les données des objets.");
  }
}

async function writeObjects(objects: ObjectData[]): Promise<void> {
  try {
    await fs.writeFile(
      objectsFilePath,
      JSON.stringify(objects, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Erreur écriture objects.json:", error);
    throw new Error("Impossible de sauvegarder les données des objets.");
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const objects = await readObjects();
      res.status(200).json(objects);
    } catch (error: any) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des objets";
      res.status(500).json({ message });
    }
  } else if (req.method === "POST") {
    try {
      const body = req.body;

      if (!body.nom || !body.type || !body.status || !body.utilisateur) {
        return res.status(400).json({
          message:
            "Champs obligatoires manquants (nom, type, status, utilisateur).",
        });
      }

      const newObject: ObjectData = {
        id: Date.now().toString(),
        nom: body.nom,
        type: body.type,
        description: body.description || "",
        longDescription: body.longDescription || "",
        status: body.status,
        utilisateur: body.utilisateur,
        photos: body.photos || [],
      };

      const objects = await readObjects();
      objects.push(newObject);
      await writeObjects(objects);

      res.status(201).json(newObject);
    } catch (error: any) {
      console.error("Erreur API POST objects:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création d un nouvel objet";
      res.status(500).json({ message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
