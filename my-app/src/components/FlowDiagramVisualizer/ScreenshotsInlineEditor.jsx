/**
 * ScreenshotsInlineEditor Component
 * Inline screenshots management within expanded step cards
 */

import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ScreenshotsInlineEditor Component
 * @param {Object} props
 * @param {Array} props.imageUrls - Array of image URL strings
 * @param {Array} props.imageCaptions - Array of caption strings
 * @param {Function} props.onChange - Callback when images/captions change
 */
const ScreenshotsInlineEditor = ({ imageUrls = [], imageCaptions = [], onChange }) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.match('image.*')) {
        toast.error(`File "${file.name}" is not an image`);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Image "${file.name}" is larger than 2MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        onChange([...imageUrls, imageUrl], [...imageCaptions, '']);
        toast.success('Screenshot added');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...imageUrls];
    const updatedCaptions = [...imageCaptions];
    
    updatedImages.splice(index, 1);
    updatedCaptions.splice(index, 1);
    
    onChange(updatedImages, updatedCaptions);
  };

  const handleUpdateCaption = (index, newCaption) => {
    const updatedCaptions = [...imageCaptions];
    updatedCaptions[index] = newCaption;
    onChange(imageUrls, updatedCaptions);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold mb-3">
        📸 Screenshots ({imageUrls.length})
      </h4>
      
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {imageUrls.map((imageUrl, index) => (
            <div key={index} className="relative border rounded-md p-1 bg-white dark:bg-gray-800">
              <img
                src={imageUrl}
                alt={imageCaptions[index] || `Screenshot ${index + 1}`}
                className="w-full h-24 object-cover rounded"
              />
              <Input
                value={imageCaptions[index] || ''}
                onChange={(e) => handleUpdateCaption(index, e.target.value)}
                placeholder="Caption..."
                className="h-6 text-xs mt-1"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        size="sm"
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        Add Screenshots
      </Button>
    </div>
  );
};

ScreenshotsInlineEditor.propTypes = {
  imageUrls: PropTypes.arrayOf(PropTypes.string),
  imageCaptions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default ScreenshotsInlineEditor;
