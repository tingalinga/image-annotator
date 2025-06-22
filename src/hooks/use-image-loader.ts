import { useState, useEffect, useCallback } from 'react';

interface UseImageLoaderOptions {
  defaultSrc?: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  onImageChange?: () => void;
}

export const useImageLoader = (options: UseImageLoaderOptions = {}) => {
  const { defaultSrc, onImageLoad, onImageChange } = options;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load default image
  useEffect(() => {
    if (!defaultSrc) {
      setInitialized(true);
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
      setInitialized(true);
      onImageLoad?.(img);
    };
    img.onerror = () => {
      setIsLoading(false);
      setInitialized(true);
      console.error('Failed to load default image:', defaultSrc);
    };
    img.src = defaultSrc;
  }, [defaultSrc, onImageLoad]);

  // Handle file upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      const reader = new FileReader();

      reader.onload = event => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImage(img);
          setIsLoading(false);
          onImageLoad?.(img);
          onImageChange?.();
        };
        img.onerror = () => {
          setIsLoading(false);
          console.error('Failed to load uploaded image');
        };
        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        setIsLoading(false);
        console.error('Failed to read uploaded file');
      };

      reader.readAsDataURL(file);
    },
    [onImageLoad, onImageChange]
  );

  return {
    image,
    isLoading,
    initialized,
    handleImageUpload,
  };
};
