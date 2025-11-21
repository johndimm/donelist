'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { deleteCategory } from '@/lib/storage';
import { Category } from '@/types';

interface CategoryManagerProps {
  categories: Category[];
  onCategoryUpdate: () => void;
  onCategoryDelete: () => void;
}

export default function CategoryManager({ categories, onCategoryUpdate, onCategoryDelete }: CategoryManagerProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(categoryId: string) {
    deleteCategory(categoryId);
    onCategoryDelete();
    setConfirmDelete(null);
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      border: '1px solid #ddd',
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
        Manage Categories
      </h3>
      {categories.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No categories yet. Create categories in the Day Edit page.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map(category => (
            <div
              key={category.id}
              style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {category.values.length} {category.values.length === 1 ? 'value' : 'values'}
                    {category.defaultValue && ` • Default: ${category.defaultValue}`}
                  </div>
                </div>
                {confirmDelete === category.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#d32f2f' }}>Delete?</span>
                    <button
                      onClick={() => handleDelete(category.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(category.id)}
                    style={{
                      padding: '0.5rem',
                      color: '#d32f2f',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Delete category"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

