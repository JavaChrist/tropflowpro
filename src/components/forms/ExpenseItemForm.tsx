import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Upload,
  Plane,
  Car,
  Train,
  Bus,
  Bed,
  UtensilsCrossed,
  Receipt,
  Euro,
  Calendar,
  X
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

// Interface pour les notes de frais dans l'architecture des déplacements
interface CreateExpenseNoteData {
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  description: string;
  amount: number;
  date: string;
  isVeloce: boolean;
  isPersonal: boolean;
  receiptUrl?: string; // Optionnel
  receiptName?: string; // Optionnel
}

interface ExpenseItemFormProps {
  onAddExpense: (expense: CreateExpenseNoteData) => void;
  onClose: () => void;
  initialData?: Partial<CreateExpenseNoteData & { receiptFile?: File | null; }>;
  isEditing?: boolean;
}

interface FormData {
  category: 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other';
  subcategory: string;
  amount: number;
  isVeloce: boolean;
  isPersonal: boolean;
  date: string;
}

const ExpenseItemForm: React.FC<ExpenseItemFormProps> = ({ onAddExpense, onClose, initialData, isEditing = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.receiptUrl || null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(initialData?.receiptUrl || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      category: initialData?.category || 'transport_long',
      subcategory: initialData?.subcategory || '',
      amount: initialData?.amount,
      isVeloce: initialData?.isVeloce || false,
      isPersonal: initialData?.isPersonal || false,
      date: initialData?.date || new Date().toISOString().split('T')[0]
    }
  });

  const watchedCategory = watch('category');

  const categoryConfig = {
    transport_long: {
      name: 'Transport longue distance',
      icon: Plane,
      color: 'blue',
      subcategories: [
        { value: 'plane', label: 'Avion', icon: Plane },
        { value: 'train', label: 'Train', icon: Train },
        { value: 'rental_car', label: 'Location de voiture', icon: Car }
      ]
    },
    transport_short: {
      name: 'Transport courte distance',
      icon: Car,
      color: 'green',
      subcategories: [
        { value: 'taxi', label: 'Taxi', icon: Car },
        { value: 'metro', label: 'Métro', icon: Bus },
        { value: 'bus', label: 'Bus', icon: Bus }
      ]
    },
    accommodation: {
      name: 'Hébergement',
      icon: Bed,
      color: 'purple',
      subcategories: [
        { value: 'hotel', label: 'Hôtel', icon: Bed },
        { value: 'airbnb', label: 'Airbnb', icon: Bed },
        { value: 'other_accommodation', label: 'Autre hébergement', icon: Bed }
      ]
    },
    meals: {
      name: 'Repas',
      icon: UtensilsCrossed,
      color: 'orange',
      subcategories: [
        { value: 'breakfast', label: 'Petit-déjeuner', icon: UtensilsCrossed },
        { value: 'lunch', label: 'Déjeuner', icon: UtensilsCrossed },
        { value: 'dinner', label: 'Dîner', icon: UtensilsCrossed },
        { value: 'snack', label: 'Collation', icon: UtensilsCrossed }
      ]
    },
    other: {
      name: 'Autres',
      icon: Receipt,
      color: 'gray',
      subcategories: [
        { value: 'parking', label: 'Parking', icon: Car },
        { value: 'toll', label: 'Péage', icon: Car },
        { value: 'communication', label: 'Communication', icon: Receipt },
        { value: 'other_expense', label: 'Autre frais', icon: Receipt }
      ]
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploadingFile(true);

      try {
        console.log('📤 Upload du fichier vers Firebase Storage...');

        // Créer une référence unique pour le fichier
        const fileExtension = file.name.split('.').pop();
        const fileName = `receipts/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const fileRef = ref(storage, fileName);

        // Upload vers Firebase Storage
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('✅ Fichier uploadé avec succès:', downloadURL);

        // Stocker l'URL Firebase persistante
        setUploadedFileUrl(downloadURL);

        // Créer URL blob pour l'aperçu local
        const previewURL = URL.createObjectURL(file);
        setPreviewUrl(previewURL);

      } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error);
        alert('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
        setSelectedFile(null);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };



  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedFileUrl(null);
  };

  const onSubmit = (data: FormData) => {
    // Générer automatiquement la description basée seulement sur la sous-catégorie
    const subcategoryLabel = currentCategory.subcategories.find(sub => sub.value === data.subcategory)?.label || data.subcategory;
    const description = subcategoryLabel; // Juste la sous-catégorie (ex: "Avion", "Hôtel", etc.)

    const newExpense: CreateExpenseNoteData = {
      ...data,
      description,
      amount: Number(data.amount), // S'assurer que amount est un nombre
    };

    // Ajouter les champs de reçu seulement s'ils existent
    if (selectedFile?.name) {
      newExpense.receiptName = selectedFile.name;
    }
    if (uploadedFileUrl) {
      newExpense.receiptUrl = uploadedFileUrl; // URL Firebase persistante !
    }

    onAddExpense(newExpense);
    onClose();
  };

  const currentCategory = categoryConfig[watchedCategory];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Modifier la note de frais' : 'Ajouter une note de frais'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Info importante */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                📝 <strong>Une note = une facture</strong><br />
                Créez une note séparée pour chaque justificatif (Train aller, Taxi, Hôtel, Train retour, etc.)<br />
                📤 <strong>Les factures sont uploadées immédiatement vers Firebase Storage</strong> pour une récupération permanente.
              </p>
            </div>

            {/* Sélection de catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Catégorie de frais *
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const isSelected = watchedCategory === key;
                  return (
                    <label
                      key={key}
                      className={`relative cursor-pointer rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${isSelected
                        ? `border-blue-500 bg-blue-50 dark:bg-blue-900/30`
                        : 'border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      <input
                        type="radio"
                        value={key}
                        checked={watchedCategory === key}
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValue('category', key as 'transport_long' | 'transport_short' | 'accommodation' | 'meals' | 'other');
                            setValue('subcategory', '');
                          }
                        }}
                      />
                      <div className="flex flex-col items-center text-center">
                        <IconComponent
                          className={`h-6 w-6 mb-2 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                        />
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-gray-300'}`}>
                          {config.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sous-catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de {currentCategory.name.toLowerCase()} *
              </label>
              <select
                {...register('subcategory', { required: 'Veuillez sélectionner un type' })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {currentCategory.subcategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
              {errors.subcategory && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subcategory.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date *
              </label>
              <input
                type="date"
                {...register('date', { required: 'La date est obligatoire' })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
              )}
            </div>

            {/* Montant et Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Euro className="inline h-4 w-4 mr-1" />
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: 'Le montant est obligatoire',
                    min: { value: 0, message: 'Le montant doit être positif' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isVeloce')}
                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Via VELOCE
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isPersonal')}
                    className="h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded focus:ring-orange-500 bg-white dark:bg-gray-700"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Frais personnel
                  </label>
                </div>
              </div>
            </div>

            {/* Upload de reçu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Justificatif / Facture
              </label>

              {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <label className={`cursor-pointer block ${isUploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                        disabled={isUploadingFile}
                      />
                      <div className="w-full max-w-xs mx-auto p-4 border-2 border-dashed rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-gray-300 dark:border-gray-600">
                        {isUploadingFile ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                            <span className="text-sm text-blue-600 dark:text-blue-400">Upload en cours...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">Choisir une facture</span>
                          </>
                        )}
                      </div>
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      PNG, JPG, PDF jusqu'à 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {selectedFile?.type.startsWith('image/') ? (
                        <img
                          src={previewUrl}
                          alt="Aperçu"
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                          <Receipt className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadedFileUrl && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploadé vers Firebase Storage
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                {isEditing ? 'Enregistrer les modifications' : 'Ajouter la note de frais'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </>
  );
};

export default ExpenseItemForm; 