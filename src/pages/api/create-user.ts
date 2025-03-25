import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const userData = req.body;
      const usersFilePath = path.join(
        process.cwd(),
        "src",
        "data",
        "users.json"
      );

      // Lire le fichier users.json
      const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));

      // Ajouter le nouvel utilisateur
      usersData.push({
        ...userData,
        profileImage: "", // Initialiser avec une image de profil vide
      });

      // Écrire les modifications dans le fichier users.json
      fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));

      res.status(200).json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({
          message:
            "Une erreur est survenue lors de la création de l'utilisateur",
        });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
