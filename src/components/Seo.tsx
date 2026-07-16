import { Helmet } from "react-helmet-async";

const SITE_URL = "https://vecto.fit";
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

type SeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
};

export default function Seo({ title, description, path, image, noindex }: SeoProps) {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_OG;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Helmet>
  );
}