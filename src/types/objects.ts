export interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description?: string;
  longDescription?: string;
  status: "publie" | "brouillon";
  utilisateur: string;
  photos?: Array<{
    url: string;
    description: string[];
  }>;
}
