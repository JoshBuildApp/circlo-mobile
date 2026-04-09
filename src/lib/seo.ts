interface CoachProfile {
  id: string;
  full_name: string;
  bio: string;
  profile_image_url: string;
  hourly_rate: number;
  specializations: string[];
  location: string;
  experience_years: number;
  rating: number;
  total_reviews: number;
  verified: boolean;
  coaching_style: string;
}

export function generateCoachMetaTags(coach: CoachProfile, username: string) {
  const title = `${coach.full_name} - Professional Coach | Circlo`;
  const description = coach.bio 
    ? `${coach.bio.substring(0, 150)}...` 
    : `Professional coach ${coach.full_name} specializing in ${coach.specializations?.[0] || 'personal development'}. Book a session starting at $${coach.hourly_rate}/hour.`;

  const ogImage = coach.profile_image_url || `${window.location.origin}/og-default-coach.png`;

  return {
    title,
    description,
    ogTitle: `${coach.full_name} - Professional Coach`,
    ogDescription: description,
    ogImage,
  };
}

export function generateCoachStructuredData(coach: CoachProfile, username: string) {
  const baseUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/coach/${username}`,
    "name": coach.full_name,
    "description": coach.bio,
    "image": coach.profile_image_url,
    "url": `${baseUrl}/coach/${username}`,
    "jobTitle": "Professional Coach",
    "worksFor": {
      "@type": "Organization",
      "name": "Circlo",
      "url": baseUrl
    },
    "address": coach.location ? {
      "@type": "PostalAddress",
      "addressLocality": coach.location
    } : undefined,
    "aggregateRating": coach.rating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": coach.rating,
      "reviewCount": coach.total_reviews,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "offers": {
      "@type": "Offer",
      "name": "Coaching Session",
      "price": coach.hourly_rate,
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": coach.hourly_rate,
        "priceCurrency": "USD",
        "unitCode": "HUR"
      },
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/book/${coach.id}`
    },
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Coach",
      "occupationLocation": coach.location ? {
        "@type": "City",
        "name": coach.location
      } : undefined,
      "skills": coach.specializations
    },
    "knowsAbout": coach.specializations,
    "alumniOf": coach.experience_years > 0 ? {
      "@type": "EducationalOrganization",
      "name": `${coach.experience_years} years of coaching experience`
    } : undefined
  };
}

export function generatePageMetaTags(
  title: string,
  description: string,
  path: string,
  image?: string
) {
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}${path}`;
  const ogImage = image || `${baseUrl}/og-default.png`;

  return {
    title: `${title} | Circlo`,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogUrl: fullUrl,
    canonical: fullUrl
  };
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateServiceStructuredData(
  name: string,
  description: string,
  provider: string,
  price: number,
  currency = "USD"
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": provider
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "availability": "https://schema.org/InStock"
    }
  };
}