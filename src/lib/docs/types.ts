export type NavNode = {
  slug: string;
  title: string;
  children: NavNode[];
};

export type ManifestDocument = {
  slug: string;
  title: string;
  sourcePath: string;
  nav: NavNode;
  excerpt?: string;
};

export type ManifestGroup = {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  documents: ManifestDocument[];
};

export type TopicLink = {
  slug: string;
  title: string;
};

export type TocLink = {
  id: string;
  title: string;
  level: number;
};

export type Breadcrumb = TopicLink;

export type TopicPage = {
  slug: string;
  title: string;
  sourcePath: string;
  docSlug: string;
  groupId: string;
  breadcrumbs: Breadcrumb[];
  toc: TocLink[];
  children: TopicLink[];
  previous: TopicLink | null;
  next: TopicLink | null;
  excerpt: string;
};
