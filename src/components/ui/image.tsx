import { forwardRef, type ImgHTMLAttributes, useEffect, useState } from 'react'
import './image.css'

const FALLBACK_IMAGE_URL = "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png";

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  // Keeping these props to avoid breaking existing usage, even if unused by standard img
  fittingType?: 'contain' | 'cover' | 'fill' | 'fit'
  originWidth?: number
  originHeight?: number
  focalPointX?: number
  focalPointY?: number
}

// Simple fallback function to clean Wix URLs if needed, though they usually work directly
const cleanUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('wix:image://v1/')) {
    // Basic attempt to extract the real URL if it's a raw media ID, 
    // but usually in these projects the full URL is passed or handled elsewhere.
    // For now, let's treat it as is or try to extract the ID.
    // Real implementation often requires the Wix media SDK which we are removing.
    // If the valid URL is in the string, we might try to extract it, 
    // but the most robust local fix is to expect standard URLs.

    // Attempt to parse: wix:image://v1/{uri}/{filename}#originWidth={w}&originHeight={h}
    // and convert to: https://static.wixstatic.com/media/{uri}
    try {
      const matches = url.match(/wix:image:\/\/v1\/([^/]+)\//);
      if (matches && matches[1]) {
        return `https://static.wixstatic.com/media/${matches[1]}`;
      }
    } catch (e) {
      console.warn("Failed to parse Wix URL:", url);
    }
  }
  return url;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(({ src, fittingType, originWidth, originHeight, focalPointX, focalPointY, className, ...props }, ref) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(cleanUrl(src))

  useEffect(() => {
    setImgSrc(cleanUrl(src))
  }, [src])

  if (!src) {
    return <div data-empty-image ref={ref} className={className} {...props} />
  }

  return (
    <img
      ref={ref}
      src={imgSrc || FALLBACK_IMAGE_URL}
      className={className}
      onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
      alt={props.alt || "Image"}
      {...props}
    />
  )
})
Image.displayName = 'Image'
