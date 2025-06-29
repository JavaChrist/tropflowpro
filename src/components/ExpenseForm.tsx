import React, { useState } from 'react';

interface ExpenseFormProps {
  onSubmit?: (expense: ExpenseData) => void;
}

interface ExpenseData {
  title: string;
  amount: number;
  date: string;
  category: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<ExpenseData>({
    title: '',
    amount: 0,
    date: '',
    category: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Nouvelle Dépense</h2>

      <div className="mb-3 sm:mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Titre
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          required
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Montant (€)
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          required
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          required
        />
      </div>

      <div className="mb-4 sm:mb-6">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Catégorie
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          required
        >
          <option value="">Sélectionner une catégorie</option>
          <option value="alimentation">Alimentation</option>
          <option value="transport">Transport</option>
          <option value="logement">Logement</option>
          <option value="loisirs">Loisirs</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 font-medium text-sm sm:text-base"
      >
        Ajouter la dépense
      </button>
    </form>
  );
};

export default ExpenseForm;
export type { ExpenseData, ExpenseFormProps };
