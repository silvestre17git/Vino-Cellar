
import React, { useState } from 'react';
import { WineEntry, WineType, CustomField } from '../types';

interface WineDetailFormProps {
  initialData?: Partial<WineEntry>;
  onSave: (wine: WineEntry) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  onAddMorePhotos?: () => void;
}

const WineDetailForm: React.FC<WineDetailFormProps> = ({ initialData, onSave, onCancel, isProcessing, onAddMorePhotos }) => {
  const [formData, setFormData] = useState<WineEntry>({
    id: initialData?.id || crypto.randomUUID(),
    imageUrls: initialData?.imageUrls || [],
    name: initialData?.name || '',
    maker: initialData?.maker || '',
    year: initialData?.year || '',
    type: initialData?.type || WineType.RED,
    price: initialData?.price || '',
    description: initialData?.description || '',
    binNumber: initialData?.binNumber || '',
    notes: initialData?.notes || '',
    customFields: initialData?.customFields || [],
    createdAt: initialData?.createdAt || Date.now()
  });

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const addCustomField = () => {
    if (!newFieldLabel) return;
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, { label: newFieldLabel, value: newFieldValue }]
    }));
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const removeCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">Photo Gallery</h4>
          {onAddMorePhotos && (
            <button 
              type="button"
              onClick={onAddMorePhotos}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Add Photos
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {formData.imageUrls.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 group">
              <img src={url} className="w-full h-full object-cover rounded-lg border border-stone-200" alt="Wine label" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {formData.imageUrls.length === 0 && (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Wine Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
              placeholder="Château Margaux"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Maker / Winery</label>
            <input
              type="text"
              name="maker"
              value={formData.maker}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
              placeholder="Margaux Winery"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Vintage Year</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
                placeholder="2015"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
              >
                {Object.values(WineType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Price ($)</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
                placeholder="120.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bin Number</label>
              <input
                type="text"
                name="binNumber"
                value={formData.binNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none"
                placeholder="B-42"
              />
            </div>
          </div>
        </div>

        {/* Narrative & Custom */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description (AI Generated)</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none resize-none"
              placeholder="Deep ruby red with notes of blackcurrant..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Personal Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-800 outline-none resize-none"
              placeholder="Bought at the vineyard in Tuscany..."
            />
          </div>
        </div>
      </div>

      {/* Dynamic Custom Fields */}
      <div className="border-t border-stone-100 pt-6">
        <h4 className="text-sm font-semibold text-stone-900 mb-4 uppercase tracking-wider">Custom Attributes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {formData.customFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
              <div className="flex-1">
                <span className="text-xs font-bold text-stone-400 block uppercase">{field.label}</span>
                <span className="text-sm text-stone-800">{field.value}</span>
              </div>
              <button 
                type="button"
                onClick={() => removeCustomField(idx)}
                className="p-1 text-stone-400 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Field Name (e.g. Alcohol %)"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none"
          />
          <input
            type="text"
            placeholder="Value (e.g. 14.5)"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none"
          />
          <button
            type="button"
            onClick={addCustomField}
            className="px-4 py-2 bg-stone-100 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
          >
            Add Field
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-stone-600 font-medium hover:text-stone-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-8 py-2.5 wine-gradient text-white font-bold rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save to Cellar'
          )}
        </button>
      </div>
    </form>
  );
};

export default WineDetailForm;
