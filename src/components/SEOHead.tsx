import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  structuredData?: object | object[];
  noIndex?: boolean;
  keywords?: string;
}

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  structuredData,
  noIndex = false,
  keywords
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    if (noIndex) setMeta('robots', 'noindex, nofollow');

    const finalCanonicalUrl = canonicalUrl || window.location.href;
    const defaultOgImage = `${window.location.origin}/og-default.png`;
    const finalOgImage = ogImage || defaultOgImage;

    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', finalOgImage, true);
    setMeta('og:url', finalCanonicalUrl, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', 'Circlo', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', finalOgImage);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', finalCanonicalUrl);

    // Structured data
    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo-head]');
      if (existingScript) existingScript.remove();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-head', 'true');
      script.textContent = JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData]);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalUrl, ogImage, ogType, structuredData, noIndex, keywords]);

  return null;
}