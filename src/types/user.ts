export type User = {
  id?: string; // Semble optionnel ou ajouté par l'API/DB
  login: string;
  email: string;
  status: "administrateur" | "utilisateur" | "redacteur"; // Inclure tous les statuts possibles
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  profileImage?: string;
  description?: string;
  // Ajoutez d'autres champs si nécessaire
};
