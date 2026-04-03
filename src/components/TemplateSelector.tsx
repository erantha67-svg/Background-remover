import React from 'react';
import { Sparkles } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (imageUrl: string) => void;
}

const TEMPLATES = [
  { id: 'tshirt', name: 'Classic T-Shirt', url: 'https://picsum.photos/seed/tshirt/800/800' },
  { id: 'hoodie', name: 'Hoodie', url: 'https://picsum.photos/seed/hoodie/800/800' },
  { id: 'pants', name: 'Pants', url: 'https://picsum.photos/seed/pants/800/800' },
  { id: 'hat', name: 'Cap', url: 'https://picsum.photos/seed/cap/800/800' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
  return (
    <div className="mt-12 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-900">Try a template</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.url)}
            className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl"
          >
            <img
              src={template.url}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-white text-sm font-bold">{template.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
