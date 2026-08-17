'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from 'react';

export type PageLink = {
  title: string;
  path: string;
  isActive: boolean;
  isSeparator?: boolean;
};

type PageDataContextModel = {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  pageDescription: string;
  setPageDescription: (description: string) => void;
  pageBreadcrumbs: PageLink[];
  setPageBreadcrumbs: (breadcrumbs: PageLink[]) => void;
};

const PageDataContext = createContext<PageDataContextModel>({
  setPageTitle: () => {},
  setPageBreadcrumbs: () => {},
  setPageDescription: () => {},
  pageTitle: '',
  pageDescription: '',
  pageBreadcrumbs: [],
});

export const PageDataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [pageBreadcrumbs, setPageBreadcrumbs] = useState<PageLink[]>([]);

  return (
    <PageDataContext.Provider
      value={{
        pageTitle,
        setPageTitle,
        pageDescription,
        setPageDescription,
        pageBreadcrumbs,
        setPageBreadcrumbs,
      }}
    >
      {children}
    </PageDataContext.Provider>
  );
};

export const usePageData = () => useContext(PageDataContext);

type PageTitleProps = {
  children?: ReactNode;
  description?: string;
  breadcrumbs?: PageLink[];
};

export const PageTitle: FC<PageTitleProps> = ({ children, description, breadcrumbs }) => {
  const { setPageTitle, setPageDescription, setPageBreadcrumbs } = usePageData();

  useEffect(() => {
    if (children) setPageTitle(children.toString());
    return () => setPageTitle('');
  }, [children, setPageTitle]);

  useEffect(() => {
    if (description) setPageDescription(description);
    return () => setPageDescription('');
  }, [description, setPageDescription]);

  useEffect(() => {
    if (breadcrumbs) setPageBreadcrumbs(breadcrumbs);
    return () => setPageBreadcrumbs([]);
  }, [breadcrumbs, setPageBreadcrumbs]);

  return null;
};
