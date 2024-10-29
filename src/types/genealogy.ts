export type Person = {
  id: string;
  nom: string;
  prenom: string;
  genre: 'homme' | 'femme';
  description: string;
  mere: string | null;
  pere: string | null;
  ordreNaissance: number;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
}; 