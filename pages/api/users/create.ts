import formidable from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface User {
  id: string;
  login: string;
  password: string;
  status: "administrateur" | "utilisateur";
  email?: string;
  profileImage?: string;
  description?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }
  try {
    const form = formidable({
      uploadDir: "/tmp",
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);

    const usersPath = path.join(process.cwd(), "src/data/users.json");
    let users: User[] = [];

    try {
      const jsonData = fs.readFileSync(usersPath, "utf8");
      users = JSON.parse(jsonData);
    } catch (error) {
      console.warn(
        "Fichier users.json non trouvé ou invalide, création d'un nouveau fichier"
      );
    }

    const loginToCompare = Array.isArray(fields.login)
      ? fields.login[0]
      : fields.login;

    const existingUser = users.find((u) => u.login === loginToCompare);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Cet identifiant est déjà utilisé" });
    }
    console.log("Champs du formulaire:", fields);
    const newUser: User = {
      id: Date.now().toString(),
      login: Array.isArray(fields.login) ? fields.login[0] : fields.login || "",
      password: Array.isArray(fields.password)
        ? fields.password[0]
        : fields.password || "",
      status:
        ((Array.isArray(fields.status) ? fields.status[0] : fields.status) as
          | "administrateur"
          | "utilisateur") || "utilisateur",
      email: Array.isArray(fields.email) ? fields.email[0] : fields.email,
      description: Array.isArray(fields.description)
        ? fields.description[0]
        : fields.description,
    };
    console.log("Nouvel utilisateur:", newUser);
    if (files.profileImage) {
      const file = Array.isArray(files.profileImage)
        ? files.profileImage[0]
        : files.profileImage;
      console.log("Chemin du fichier 1:", file.filepath);
      const uploadDir = path.join(process.cwd(), "public/uploads/users");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      console.log("Chemin du fichier 2:", file.filepath);
      const finalPath = path.join(uploadDir, file.newFilename);
      await fs.promises.rename(file.filepath, finalPath);
      newUser.profileImage = `/uploads/users/${file.newFilename}`;
      console.log("Chemin de l'image: 3", finalPath);
    }

    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
