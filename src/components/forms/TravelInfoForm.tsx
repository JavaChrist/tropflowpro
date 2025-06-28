import React from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, MapPin, FileText, MessageSquare } from 'lucide-react';

// Interface simplifiée sans contrat et collaborateur
interface SimplifiedTravelInfo {
  departure: {
    date: string;
  };
  return: {
    date: string;
  };
  destination: string;
  purpose: string; // Nom du déplacement / identifiant principal
  remarks: string;
}

interface TravelInfoFormProps {
  initialData?: SimplifiedTravelInfo;
  onSubmit: (data: SimplifiedTravelInfo) => void;
  onNext: () => void;
}

const TravelInfoForm: React.FC<TravelInfoFormProps> = ({
  initialData,
  onSubmit,
  onNext
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SimplifiedTravelInfo>({
    defaultValues: initialData || {
      departure: { date: '' },
      return: { date: '' },
      destination: '',
      purpose: '',
      remarks: ''
    }
  });

  const onFormSubmit = (data: SimplifiedTravelInfo) => {
    onSubmit(data);
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nouveau déplacement
          </h2>
          <p className="text-gray-600">
            Créez une nouvelle mission et ajoutez vos frais
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Vos informations personnelles et numéro de contrat sont automatiquement renseignés depuis votre profil.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Nom principal du déplacement */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              <FileText className="inline h-5 w-5 mr-2" />
              Nom du déplacement *
            </label>
            <input
              type="text"
              {...register('purpose', {
                required: 'Le nom du déplacement est obligatoire'
              })}
              className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Ex: Réunion client Lyon, Formation Paris, Audit Marseille..."
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Ce nom permettra d'identifier et regrouper toutes les notes de frais liées à ce déplacement.
            </p>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Destination *
            </label>
            <input
              type="text"
              {...register('destination', {
                required: 'La destination est obligatoire'
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Ville ou lieu de mission"
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date de départ *
              </label>
              <input
                type="date"
                {...register('departure.date', {
                  required: 'La date de départ est obligatoire'
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {errors.departure?.date && (
                <p className="mt-1 text-sm text-red-600">{errors.departure.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date de retour *
              </label>
              <input
                type="date"
                {...register('return.date', {
                  required: 'La date de retour est obligatoire'
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {errors.return?.date && (
                <p className="mt-1 text-sm text-red-600">{errors.return.date.message}</p>
              )}
            </div>
          </div>

          {/* Remarques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              Remarques (optionnel)
            </label>
            <textarea
              {...register('remarks')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Informations complémentaires sur le déplacement..."
            />
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-medium"
            >
              Créer le déplacement et ajouter les frais
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravelInfoForm; 