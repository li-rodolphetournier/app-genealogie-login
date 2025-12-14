import React, { useState } from 'react';
import { getErrorMessage } from '@/lib/errors/messages';

// Importer les composants Shadcn UI si nécessaire
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Loader2 } from "lucide-react"; // Pour l'icône de chargement

// Interface pour les props du composant (si nécessaire, sinon peut être omis)
// interface UserCreateFormProps {
//   // Définir les props ici
// }

const UserCreateForm: React.FC = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    status: 'utilisateur' as 'administrateur' | 'utilisateur',
    email: '',
    description: '',
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [success, setSuccess] = useState<string | null>(null); // Message de succès

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Réinitialiser les messages lors de la modification
    setError(null);
    setSuccess(null);
  };

  // Spécifier le type pour Select de Shadcn si utilisé
  // const handleStatusChange = (value: 'utilisateur' | 'administrateur') => {
  //   setFormData(prev => ({ ...prev, status: value }));
  //   setError(null);
  //   setSuccess(null);
  // };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (file) {
      // Vérification simple du type MIME côté client (optionnel)
      if (!file.type.startsWith('image/')) {
        setError("Veuillez sélectionner un fichier image valide.");
        setProfileImageFile(null);
        setProfileImagePreview('');
        e.target.value = ''; // Réinitialiser l'input file
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageFile(null);
      setProfileImagePreview('');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true); // Activer le chargement

    // Validation simple côté client (ex: mot de passe)
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      // Upload de l'image si présente
      let profileImageUrl: string | null = null;
      if (profileImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profileImageFile);
        uploadFormData.append('folder', 'users');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profileImageUrl = uploadData.imageUrl || uploadData.url;
        }
      }

      // Créer l'utilisateur
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.login,
          email: formData.email,
          password: formData.password,
          status: formData.status,
          description: formData.description,
          profileImage: profileImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || getErrorMessage('USER_CREATE_FAILED'));
      }

      const data = await response.json();
      setSuccess(`Utilisateur ${data.login} créé avec succès !`); // Afficher un message de succès

      // Réinitialiser le formulaire
      setFormData({
        login: '',
        password: '',
        status: 'utilisateur',
        email: '',
        description: '',
      });
      setProfileImageFile(null);
      setProfileImagePreview('');
      // Réinitialiser la valeur de l'input file visuellement (nécessite une ref ou une clé unique)
      const fileInput = document.getElementById('profileImage') as HTMLInputElement;
      if (fileInput) fileInput.value = '';


    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
      setError(errorMessage); // Afficher le message d'erreur
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false); // Désactiver le chargement
    }
  };

  // Utilisation de classes Tailwind pour la mise en forme
  // et potentiellement des composants Shadcn (commentés pour l'instant)
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 max-w-lg mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Créer un nouvel utilisateur</h2>

      {/* Affichage des messages d'erreur et de succès */}
      {error && (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"> {/* Utilisation de div au lieu de Alert de shadcn */}
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        // <Alert variant="destructive">
        //   <AlertTitle>Erreur</AlertTitle>
        //   <AlertDescription>{error}</AlertDescription>
        // </Alert>
      )}
      {success && (
        <div role="status" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"> {/* Utilisation de div au lieu de Alert de shadcn */}
          <strong className="font-bold">Succès !</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
        // <Alert variant="success"> {/* Assurez-vous d'avoir une variante 'success' ou utilisez une classe standard */}
        //   <AlertTitle>Succès</AlertTitle>
        //   <AlertDescription>{success}</AlertDescription>
        // </Alert>
      )}

      {/* Champs du formulaire */}
      <div className="grid grid-cols-1 gap-y-4">
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">Login</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="login">Login</Label> */}
          <input type="text" id="login" name="login" value={formData.login} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /> {/* Input HTML stylisé */}
          {/* <Input type="text" id="login" name="login" value={formData.login} onChange={handleChange} required /> */}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="password">Mot de passe</Label> */}
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /> {/* Input HTML stylisé */}
          {/* <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required /> */}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="status">Statut</Label> */}
          <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"> {/* Select HTML stylisé */}
            <option value="utilisateur">Utilisateur</option>
            <option value="redacteur">Rédacteur</option>
            <option value="administrateur">Administrateur</option>
          </select>
          {/* <Select name="status" value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utilisateur">Utilisateur</SelectItem>
              <SelectItem value="administrateur">Administrateur</SelectItem>
            </SelectContent>
          </Select> */}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Optionnel)</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="email">Email (Optionnel)</Label> */}
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /> {/* Input HTML stylisé */}
          {/* <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} /> */}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="description">Description (Optionnel)</Label> */}
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /> {/* Textarea HTML stylisé */}
          {/* <Textarea id="description" name="description" value={formData.description} onChange={handleChange} /> */}
        </div>

        {/* Section pour l'upload de la photo de profil */}
        <div>
          <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">Photo de profil (Optionnel)</label> {/* Utilisation de label HTML */}
          {/* <Label htmlFor="profileImage">Photo de profil (Optionnel)</Label> */}
          <div className="mt-1 flex items-center space-x-4">
            {/* Affichage de la prévisualisation ou d'un placeholder */}
            {profileImagePreview ? (
              <img src={profileImagePreview} alt="Prévisualisation" className="w-16 h-16 rounded-full object-cover border border-gray-300" />
            ) : (
              <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
            )}
            {/* Input file stylisé */}
            <label htmlFor="profileImage" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span>Choisir un fichier</span>
              <input id="profileImage" name="profileImage" type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
            </label>
            {/* <Button type="button" variant="outline" onClick={() => document.getElementById('profileImage')?.click()}>Choisir un fichier</Button>
             <Input id="profileImage" name="profileImage" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" /> */}
          </div>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}> {/* Button HTML stylisé */}
            {isLoading ? (
              <>
                {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                En cours...
              </>
            ) : (
              'Créer l utilisateur'
            )}
          </button>
          {/* <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              'Créer l'utilisateur'
            )}
          </Button> */}
        </div>
      </div>
    </form>
  );
};

// Supprimer les déclarations en dehors du composant s'il y en avait
// const [formData, setFormData] = ... // Supprimé
// const [profileImage, setProfileImage] = ... // Supprimé
// const [profileImagePreview, setProfileImagePreview] = ... // Supprimé
// const handleChange = ... // Supprimé
// const handleSubmit = ... // Supprimé
// const handlePhotoChange = ... // Supprimé

export default UserCreateForm; // Assurez-vous que l'export est correct
