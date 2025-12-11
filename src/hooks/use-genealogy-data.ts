import { useState, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Person } from '@/types/genealogy';

export function useGenealogyData(initialPersons: Person[], apiEndpoint: string = '/api/genealogie') {
  const { showToast } = useToast();
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
        showToast('Données rafraîchies avec succès', 'success');
      } else {
        showToast('Erreur lors du rafraîchissement des données', 'error');
        console.error('Erreur lors du rafraîchissement des données');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      showToast('Erreur lors du rafraîchissement des données', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [apiEndpoint, showToast]);

  const addPerson = useCallback(async (person: Person) => {
    try {
      const response = await fetch('/api/genealogie/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(person),
      });

      if (response.ok) {
        await refreshData();
        showToast('Personne ajoutée avec succès !', 'success');
        return true;
      } else {
        const error = await response.json();
        const errorMessage = error.error || error.message || getErrorMessage('GENEALOGY_PERSON_ADD_FAILED');
        showToast(errorMessage, 'error');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout :', error);
      showToast(getErrorMessage('GENEALOGY_PERSON_ADD_FAILED'), 'error');
      return false;
    }
  }, [refreshData, showToast]);

  const updatePerson = useCallback(async (person: Person) => {
    try {
      const response = await fetch('/api/genealogie/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(person),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (response.ok) {
        await refreshData();
        if (isJson) {
          const result = await response.json();
          showToast(result.message || 'Personne mise à jour avec succès !', 'success');
        } else {
          showToast('Personne mise à jour avec succès !', 'success');
        }
        return true;
      } else {
        const status = response?.status ?? 0;
        const statusText = response?.statusText ?? 'Inconnu';
        
        let responseText = '';
        try {
          responseText = await response.text();
        } catch (textError) {
          console.error('Impossible de lire le texte de la réponse:', textError);
        }
        
        let errorMessage = getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
        
        if (responseText) {
          if (isJson) {
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.details && Array.isArray(errorData.details)) {
                const validationErrors = errorData.details
                  .map((d: { field?: string; message?: string }) => 
                    d.field ? `${d.field}: ${d.message || 'Erreur'}` : d.message || 'Erreur'
                  )
                  .join(', ');
                errorMessage = `${errorData.error || 'Erreur de validation'}: ${validationErrors}`;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (parseError) {
              errorMessage = responseText || `Erreur ${status}: ${statusText}`;
            }
          } else {
            errorMessage = responseText;
          }
        } else {
          errorMessage = `Erreur ${status}: ${statusText}`;
        }
        
        showToast(errorMessage, 'error');
        return false;
      }
    } catch (error) {
      console.error('Erreur réseau lors de la mise à jour :', error);
      const errorMsg = error instanceof Error 
        ? `Erreur réseau: ${error.message}` 
        : getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED');
      showToast(errorMsg, 'error');
      return false;
    }
  }, [refreshData, showToast]);

  return {
    persons,
    setPersons,
    isRefreshing,
    refreshData,
    addPerson,
    updatePerson
  };
}

