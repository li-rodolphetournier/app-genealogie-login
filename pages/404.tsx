import { useEffect, useState } from "react";

export default function Custom404() {
  const [data, setData] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/something")
        .then((res) => res.json())
        .then(setData);
    }
  }, []);

  // Afficher un message simple si on est côté serveur
  if (typeof window === "undefined") {
    return <h1>404 - Page non trouvée</h1>;
  }

  return <div>{data ? data.message : "Chargement... c'est la fete"}</div>;
}